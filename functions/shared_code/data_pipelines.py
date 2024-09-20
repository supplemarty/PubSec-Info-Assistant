from openai import AsyncAzureOpenAI
from azure.data.tables import TableClient
import json
import requests
from azure.identity import ClientSecretCredential

class DataPipelines:
    """ Class for Custom Data Pipelines"""

    def __init__(self, blob_connection_string: str, azure_endpoint: str, api_key: str, api_version: str, deployment_name: str):
        self.tc_pipes = TableClient.from_connection_string(blob_connection_string, "DataIngestionPipelines")
        self.tc_useraccess = TableClient.from_connection_string(blob_connection_string, "UserFolderAccess")
        self.deployment_name = deployment_name
        self.ai_cli = AsyncAzureOpenAI(
            azure_endpoint = azure_endpoint, 
            api_key=api_key,  
            api_version=api_version)


    def get_pipelines_for_user(self, userid: str) -> list:
        pipelines = []
        qs = f"PartitionKey eq 'user' and RowKey eq '{userid.lower()}' and DataIngestionPipelinePermissionsJson gt ''"
        usersIterator = self.tc_useraccess.query_entities(qs)
        users = [u for u in usersIterator]
        if len(users) == 1:
            ppjson = users[0]["DataIngestionPipelinePermissionsJson"]
            for pp in json.loads(ppjson):
                pipeline_name = pp["pipeline"]
                pipeline = self.get_pipeline(pipeline_name)
                pipeline["name"] = pipeline_name
                pipelines.append(pipeline)
        return pipelines

    def get_pipeline(self, pipeline_name) -> dict:
        te_pipe = self.tc_pipes.get_entity(partition_key="pipeline", row_key=pipeline_name)
        if "PipelineDefinitionJson" in te_pipe:
            pdjson = te_pipe["PipelineDefinitionJson"]
            pd = json.loads(pdjson)
            return pd
        else:
            raise Exception("Data Pipeline Missing PipelineDefinitionJson")

    async def get_data_from_content_async(self, pipeline: dict, content: str):
        system_content = pipeline["systemPrompt"]
        messages = [{'role': 'system', 'content': system_content}, {'role': 'user', 'content': content}]
        chat_completion = await self.ai_cli.chat.completions.create(
            model= self.deployment_name,
            messages=messages,
            temperature=0.1,
            n=1
        ) 
        json_str = chat_completion.choices[0].message.content
        return json_str




class DataPiplineExcelTarget:
    """ Class for Sharepoint Excel Files"""
    def __init__(self, tenant_id: str, client_id: str, client_secret: str, pipeline: dict, sp_host_name: str):
        self.tenant_id = tenant_id
        self.client_id = client_id
        self.client_secret = client_secret
        self.sp_host_name = sp_host_name
        self.pipeline = pipeline
    
    def get_token(self) -> str:
        az_cred = ClientSecretCredential(tenant_id=self.tenant_id, client_id=self.client_id, client_secret=self.client_secret)
        az_token = az_cred.get_token("https://graph.microsoft.com/.default")
        return az_token.token

    
    def add_data_to_workbook(self, items: list) -> dict:
        headers = {"Authorization": f"Bearer {self.get_token()}"}
        base_url = "https://graph.microsoft.com/v1.0"

        #get site id
        sps = self.pipeline["sharepointSite"]
        url = f"{base_url}/sites/{self.sp_host_name}:/sites/{sps}?$select=id"
        site_id = requests.get(url, headers=headers).json()["id"]

        #get drive id
        url = f"{base_url}/sites/{site_id}/drive?$select=id"
        driveId = requests.get(url, headers=headers).json()["id"]

        #get file id
        fp = self.pipeline["excelFilePath"]
        url = f"{base_url}/drives/{driveId}/root:{fp}?$select=id"
        fileId = requests.get(url, headers=headers).json()["id"]

        # Get Table columns
        table_name = self.pipeline["excelTableName"]
        url = f"{base_url}/drives/{driveId}/items/{fileId}/workbook/tables/{table_name}/columns?$select=name,index"
        columns = requests.get(url, headers=headers).json()
        column_map = {}
        column_names = [None] * len(columns["value"])
        for column in columns["value"]:
            column_map[column["name"]] = column["index"]
            column_names[column["index"]] = column["name"]
        
        rows = []
        for item in items:
            cells = [None] * len(column_map)
            for col_name in column_map.keys():
                cells[column_map[col_name]] = item[col_name]
            rows.append(cells)

        url = f"{base_url}/drives/{driveId}/items/{fileId}/workbook/tables/{table_name}/rows"
        body = { "values": rows }
        pr = requests.post(url, headers=headers, json=body)
        if pr.ok:
            rj = pr.json()
            return rj, column_names
        else:
            raise Exception("Error during Excel import")

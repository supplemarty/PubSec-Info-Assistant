from azure.identity import ClientSecretCredential
import requests

class SharepointClient:
    """ Class for Sharepoint Files"""
    def __init__(self, tenant_id: str, client_id: str, client_secret: str, sp_host_name: str):
        self.tenant_id = tenant_id
        self.client_id = client_id
        self.client_secret = client_secret
        self.sp_host_name = sp_host_name
        self.az_token = None
    
    def get_token(self) -> str:
        if not (self.az_token):
            az_cred = ClientSecretCredential(tenant_id=self.tenant_id, client_id=self.client_id, client_secret=self.client_secret)
            self.az_token = az_cred.get_token("https://graph.microsoft.com/.default")
        return self.az_token.token
    
    def reset_token(self):
        self.az_token = None
        
    def get_url(self, rel_url: str) -> str:
        base_url = "https://graph.microsoft.com/v1.0"
        return f"{base_url}/{rel_url}"
    
    def get_headers(self) -> dict[str,str]:
        return {"Authorization": f"Bearer {self.get_token()}"}
    
    def get_drive_id(self, sp_site_name: str) -> str:
        #get site id
        url = self.get_url(f"sites/{self.sp_host_name}:/sites/{sp_site_name}?$select=id")
        site_id = requests.get(url, headers=self.get_headers()).json()["id"]

        #get drive id
        url = self.get_url(f"sites/{site_id}/drive?$select=id")
        drive_id = requests.get(url, headers=self.get_headers()).json()["id"]

        return drive_id, site_id
    
    def get_file_id(self, sp_site_name: str, sp_file_path: str) -> str:

        #get drive id
        drive_id, site_id = self.get_drive_id(sp_site_name)

        #get file id
        url = self.get_url(f"drives/{drive_id}/root:{sp_file_path}?$select=id")
        fileId = requests.get(url, headers=self.get_headers()).json()["id"]

        return drive_id, fileId

    def get_excel_table_columns(self, drive_id: str, file_id: str, table_name: str):
        url = self.get_url(f"drives/{drive_id}/items/{file_id}/workbook/tables/{table_name}/columns?$select=name,index")
        columns = requests.get(url, headers=self.get_headers()).json()

        return columns

    def add_rows_to_excel_table(self, drive_id: str, file_id: str, table_name: str, rows: list):
        url = self.get_url(f"drives/{drive_id}/items/{file_id}/workbook/tables/{table_name}/rows")
        body = { "values": rows }
        pr = requests.post(url, headers=self.get_headers(), json=body)
        if not pr.ok:
            raise Exception("Error during Excel import")
        
    def get_folder_files(self, drive_id: str, sp_folder_path: str):

        url = self.get_url(f"drives/{drive_id}/root:/{sp_folder_path}:/children")

        folder_contents = requests.get(url, headers=self.get_headers()).json()
        items_exist = 'value' in folder_contents

        while (items_exist):
            for item in folder_contents['value']:
                if 'file' in item:
                    yield { "name": item['name'], "id": item['id'], "url": item["webUrl"], "lastModifiedDateTime": item["lastModifiedDateTime"] }
            if "@odata.nextLink" in folder_contents:
                url = folder_contents["@odata.nextLink"]
                folder_contents = requests.get(url, headers=self.get_headers()).json()
                items_exist = 'value' in folder_contents
            else:
                items_exist = False

    def get_file_contents(self, site_id: str, drive_id, file_id: str):
                    
        url = self.get_url(f"sites/{site_id}/drives/{drive_id}/items/{file_id}/content")
        dl_resp = requests.get(url, headers=self.get_headers())
        if dl_resp.status_code == 200:
            return dl_resp.content
        else:
            raise Exception("Error getting file contents")


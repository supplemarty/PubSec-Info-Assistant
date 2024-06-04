import os
from azure.storage.blob import BlobServiceClient
from rich.console import Console
from urllib.parse import unquote
from azure.communication.email import EmailClient

console = Console()
BLOB_CONNECTION_STRING = os.environ.get("BLOB_CONNECTION_STRING")
AZURE_BLOB_STORAGE_UPLOAD_CONTAINER = "upload"


def get_tags(blob_path):
    """ Retrieves tags from the upload container blob
    """     
    # Remove the container prefix
    path_parts = blob_path.split('/')
    blob_path = '/'.join(path_parts[1:])
    
    blob_service_client = BlobServiceClient.from_connection_string(BLOB_CONNECTION_STRING)
    # container_client = blob_service_client.get_container_client(ENV["AZURE_BLOB_STORAGE_CONTAINER"])
    blob_client = blob_service_client.get_blob_client(
        container=AZURE_BLOB_STORAGE_UPLOAD_CONTAINER,
        blob=blob_path)
    
    # blob_client = container_client.get_blob_client(
    # blob_client = container_client.get_blob_client(container_client=container_client, blob=blob_path)
    blob_properties = blob_client.get_blob_properties()
    tags = blob_properties.metadata.get("tags")
    if tags != '' and tags is not None:
        if isinstance(tags, str):
            tags_list = [unquote(tag.strip()) for tag in tags.split(",")]
        else:
            tags_list = [unquote(tag.strip()) for tag in tags]
    else:
        tags_list = []

    
    # t2 = if ((blob_properties.tag_count or 0) > 0):
    #     blob_client.get_blob_tags()
    # else:
    #     {}

    if "TagKey1" in t2: console.log(t2["TagKey1"])
    return tags_list

#t = get_tags("/HShah@divcore.com/OPEN 2023-AIR - DBRSM Presale Report.pdf")


def emailtest():
    try:
        connection_string = "endpoint=https://infoasst-divcoai-azure-communication.unitedstates.communication.azure.com/;accesskey=O90+GyWM9jUvPUGhxgrbYb0PKdAKzB1j3uYhUDwwlLfesjLMfKdnvtrt9PaN56CmnaguxxLAvC7W85kdJWS9bA=="
        client = EmailClient.from_connection_string(connection_string)

        message = {
            "senderAddress": "DoNotReply@99280c95-b2de-4328-add5-4f08e4844735.azurecomm.net",
            "recipients":  {
                "to": [{"address": "msupple@divcowest.com" }],
            },
            "content": {
                "subject": "This is A Test",
                "plainText": "Hello world via email yo!!",
                "html": "<b>Hello world via email <i>yo yo</i>!!</b>"
            }
        }

        poller = client.begin_send(message)
        result = poller.result()

    except Exception as ex:
        print(ex)
        
emailtest()





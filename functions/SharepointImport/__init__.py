import logging
import re
import os
import json
from azure.data.tables import TableClient
import dateutil.parser
import dateutil
from azure.storage.blob import BlobServiceClient, ContentSettings
import mimetypes
from shared_code.status_log import State, StatusClassification, StatusLog
import azure.functions as func
from datetime import datetime, timezone
from shared_code.email_notifications import EmailNotifications
from shared_code.sharepoint_client import SharepointClient

tc_folders = TableClient.from_connection_string(os.environ["BLOB_CONNECTION_STRING"], "Folders")
email_notifications = EmailNotifications(os.environ["EMAIL_CONNECTION_STRING"], os.environ["NOTIFICATION_EMAIL_SENDER"], os.environ["ERROR_EMAIL_RECIPS_CSV"], tc_folders)

sp_client = SharepointClient(os.environ["DIVCO_ETL_AZURE_TENANT_ID"], os.environ["DIVCO_ETL_AZURE_CLIENT_ID"], os.environ["DIVCO_ETL_AZURE_CLIENT_SECRET"], os.environ['SHAREPOINT_HOST_NAME'])

blob_svc_client = BlobServiceClient(account_url = os.environ["BLOB_STORAGE_ACCOUNT_ENDPOINT"], credential=os.environ["AZURE_BLOB_STORAGE_KEY"] )
blob_cont_client = blob_svc_client.get_container_client(container=os.environ["BLOB_STORAGE_ACCOUNT_UPLOAD_CONTAINER_NAME"]);

cosmosdb_url = os.environ["COSMOSDB_URL"]
cosmosdb_key = os.environ["COSMOSDB_KEY"]
cosmosdb_log_database_name = os.environ["COSMOSDB_LOG_DATABASE_NAME"]
cosmosdb_log_container_name = os.environ["COSMOSDB_LOG_CONTAINER_NAME"]

status_log = StatusLog(cosmosdb_url,
                       cosmosdb_key,
                       cosmosdb_log_database_name,
                       cosmosdb_log_container_name)

def main(mytimer: func.TimerRequest) -> None:
    '''This function is a cron job that runs every 15 minutes, detects when 
    files have been created and/or updated in Sharepoint based on group folder configuration
    '''

    utc_timestamp = datetime.utcnow().replace(
        tzinfo=timezone.utc).isoformat()

    if mytimer.past_due:
        logging.info('The timer is past due!')

    logging.info('Python timer trigger function ran at %s', utc_timestamp)

    import_folders = tc_folders.query_entities("SharepointSourcesJson gt ''")

    for import_folder in import_folders:
        
        folder_name = import_folder["RowKey"]
        logging.info(f"Processing Folder {folder_name}")
        sp_sources_json = import_folder["SharepointSourcesJson"]
        sp_sources = json.loads(sp_sources_json)

        for sp_source in sp_sources:

            sp_client.reset_token()

            sp_site_name = sp_source["SiteName"]
            drive_id, site_id = sp_client.get_drive_id(sp_site_name)

            sp_files_regex = sp_source["FilesRegex"]
            sp_folder_path = sp_source["FolderPath"]

            sp_files = sp_client.get_folder_files(drive_id, sp_folder_path)

            for sp_file in sp_files:

                sp_file_name = sp_file["name"]

                process_file = re.search(sp_files_regex, sp_file_name)
                logging.info(f"Process File {sp_file_name}: {process_file}")

                if (process_file):

                    blob_path = f"{folder_name}/{sp_file_name}"

                    try:
                        blob_content_type, blob_encoding = mimetypes.guess_type(sp_file_name, strict=True)

                        # get sp file last modified dt
                        sp_last_mod = dateutil.parser.isoparse(sp_file["lastModifiedDateTime"])

                        # see if blob exists if so compare last modified
                        blob_client = blob_cont_client.get_blob_client(blob=blob_path)
                        blob_exists = blob_client.exists()
                        if (blob_exists):
                            blob_props = blob_client.get_blob_properties()
                            upload_blob = (sp_last_mod > blob_props.last_modified)
                        else:
                            upload_blob = True

                        if (upload_blob):

                            file_content = sp_client.get_file_contents(site_id, drive_id, sp_file["id"])

                            logging.info(f"Uploading Blob {blob_path}")
                            full_path = os.environ["BLOB_STORAGE_ACCOUNT_UPLOAD_CONTAINER_NAME"] + '/' + blob_path
                            
                            if (blob_exists):
                                blob_client.upload_blob(data=file_content, overwrite=True)
                                status_log.upsert_document(document_path=full_path,
                                            status='Refreshed from Sharepoint',
                                            status_classification=StatusClassification.INFO,
                                            state=State.QUEUED,
                                            fresh_start=False)
                            else:
                                blob_client.upload_blob(data=file_content, content_settings=ContentSettings(content_type=blob_content_type))
                                status_log.upsert_document(document_path=full_path,
                                            status='Imported from Sharepoint',
                                            status_classification=StatusClassification.INFO,
                                            state=State.UPLOADED)

                            status_log.save_document(document_path=full_path)  

                    except Exception as err:
                        logging.info("An exception occured with doc %s: %s", blob_path, str(err))
                        status_log.upsert_document(full_path,
                                                f'Error importing sharepoint document: {str(err)}',
                                                StatusClassification.ERROR,
                                                State.ERROR)
                        status_log.save_document(full_path)
                        email_notifications.send_error_email(blob_path, f"Sharepoint Import Error: {str(err)}")

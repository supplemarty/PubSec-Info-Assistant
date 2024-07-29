from azure.communication.email import EmailClient
import re
import json

# Regular expression for validating an Email
regex_email = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b'

class EmailNotifications:
    """ Class for logging status of various processes to Cosmos DB"""

    def __init__(self, email_connection_string, sender_email_address, error_recips_csv, _table_folder_client):
        """ Constructor function """
        self._email_connection_string = email_connection_string
        self._sender_email_address = sender_email_address
        self._email_client = EmailClient.from_connection_string(email_connection_string)
        self._error_to = [{"address": to_email } for to_email in error_recips_csv.split(",")]
        self._table_folder_client = _table_folder_client

    def internal_send_email(self, email_message):
        poller = self._email_client.begin_send(email_message)
        email_result = poller.result()
        return email_result

    def gen_body_html(self, doc_name, msg, is_error):

        msg_style = "color: red;" if is_error else ""

        html = f"<html> \
                    <head><title>Azure AI</title></head> \
                    <body> \
                        <div style='background-color: rgb(168, 166, 161); color: #f2f2f2; padding: 10px;'> \
                            <table><tr><td><img style='height: 20px;' src='https://coreapps.divcowest.com/notification/images/divcore_logo_white.png' alt='Azure OpenAI'><td class='headerTitle'>Azure AI</td></tr></table> \
                        </div> \
                        <div style='padding: 10px;'> \
                            <b>Document: {doc_name}<br/></b> \
                            <i style='{msg_style}'>{msg}</i> \
                        </div> \
                    </body> \
                </html>"
        
        return html
    
    def recips_from_foldername(self, folder):

        if (re.fullmatch(regex_email, folder)):
            return [{"address": folder }]
        else:
            # Get email recips from folder information in storage
            folderentityquery = self._table_folder_client.query_entities(f"PartitionKey eq 'folder' and RowKey eq '{folder}'")
            folderres = [a for a in folderentityquery]

            #folder_entity = self._table_folder_client.get_entity("folder", folder)
            if (len(folderres) == 1):
                folder_entity = folderres[0]
                if ("EmailRecipientsJson" in folder_entity):
                    return [{"address": e } for e in json.loads(folder_entity["EmailRecipientsJson"])]
        
        return []



    def send_error_email(self, blob_path, error_msg):

        folder, doc_name = self.parse_blob_name(blob_path)

        email_message = {
            "senderAddress": self._sender_email_address,
            "recipients":  {
                "to": self._error_to,
                "cc": self.recips_from_foldername(folder)
            },
            "content": {
                "subject": "AI Document Processing Error",
                "html": self.gen_body_html(doc_name, error_msg, True)
            }
        }

        return self.internal_send_email(email_message)


    def send_email(self, blob_path, subject, msg):

        folder, doc_name = self.parse_blob_name(blob_path)

        email_message = {
            "senderAddress": self._sender_email_address,
            "recipients":  {
                "to": self.recips_from_foldername(folder)
            },
            "content": {
                "subject": subject,
                "html": self.gen_body_html(doc_name, msg, False)
            }
        }
        
        return self.internal_send_email(email_message)


    def parse_blob_name(self, blob_path):
        segments = blob_path.split("/")
        idx = 1 if blob_path[0] == "/" else 0
        return segments[idx + 1], segments[idx + 2]
from azure.communication.email import EmailClient

class EmailNotifications:
    """ Class for logging status of various processes to Cosmos DB"""

    def __init__(self, email_connection_string, sender_email_address, error_recips_csv):
        """ Constructor function """
        self._email_connection_string = email_connection_string
        self._sender_email_address = sender_email_address
        self._email_client = EmailClient.from_connection_string(email_connection_string)
        self._error_to = [{"address": to_email } for to_email in error_recips_csv.split(",")]

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

    def send_error_email(self, blob_path, error_msg):

        user_email, doc_name = self.parse_blob_name(blob_path)

        email_message = {
            "senderAddress": self._sender_email_address,
            "recipients":  {
                "to": self._error_to,
                "cc": [{"address": user_email }]
            },
            "content": {
                "subject": "AI Document Processing Error",
                "html": self.gen_body_html(doc_name, error_msg, True)
            }
        }

        return self.internal_send_email(email_message)


    def send_email(self, blob_path, subject, msg):

        user_email, doc_name = self.parse_blob_name(blob_path)

        email_message = {
            "senderAddress": self._sender_email_address,
            "recipients":  {
                "to": [{"address": user_email }]
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
        return segments[idx], segments[idx + 1]
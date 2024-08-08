from unstructured.partition.email import partition_email
from io import BytesIO
import email


with open("test_email.eml", "rb") as fh:
    buf = BytesIO(fh.read())
    elements = partition_email(file=buf)
    print(f'Subject: {elements[0].metadata.subject}')
    print(f'From: {elements[0].metadata.sent_from[0]}')

    

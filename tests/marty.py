from unstructured.partition.msg import partition_msg
from io import BytesIO
# import email


with open("test_data/RE_ Regarding Spectrum Equipment @ 540 Madison_ New York NY 10022 - relocate from @ 3 E 54th St-10022.msg", "rb") as fh:
    buf = BytesIO(fh.read())
    elements = partition_msg(file=buf)
    print(f'Subject: {elements[0].metadata.subject}')
    print(f'From: {elements[0].metadata.sent_from[0]}')

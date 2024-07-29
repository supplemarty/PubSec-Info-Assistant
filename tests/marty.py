def parse_blob_name(blob_path):
    segments = blob_path.split("/")
    idx = 1 if blob_path[0] == "/" else 0
    return segments[idx + 1], segments[idx + 2]

blob_path = "/upload/QZhang@divcore.com/tsql.txt"
folder, doc_name = parse_blob_name(blob_path)
print(folder)
print(doc_name)
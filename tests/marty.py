import tiktoken
import io
from shared_code.csv_chunker import CSVChunker

# Initialize tokenizer (assuming you are using OpenAI's tokenizer)
encoding = tiktoken.get_encoding("cl100k_base")  # Adjust this to your specific model's tokenizer

def count_tokens(text):
    """Count the number of tokens in the given text."""
    return len(encoding.encode(text))


chunker = CSVChunker(max_tokens=750, token_count_func=count_tokens)
with open("test_data/test_example.csv", "rb") as fh:
    csv_data = io.BytesIO(fh.read())
    chunks = chunker.chunk_csv_to_html(csv_data)
    for i, chunk in enumerate(chunks):
        print(f"Chunk {i+1}:\n{chunk}")

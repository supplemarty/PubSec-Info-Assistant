import csv
import io
import html

class CSVChunker:
    def __init__(self, max_tokens=750, token_count_func=None):
        self.max_tokens = max_tokens
        if token_count_func is None:
            raise ValueError("A token counting function must be provided.")
        self.count_tokens = token_count_func

    def row_to_csv_string(self, row, delimiter=',', quotechar='"'):
        """Convert a CSV row to a CSV formatted string, handling quotes and special characters."""
        output = io.StringIO()
        csv_writer = csv.writer(output, delimiter=delimiter, quotechar=quotechar, quoting=csv.QUOTE_MINIMAL)
        csv_writer.writerow(row)
        return output.getvalue()

    def escape_html(self, text):
        """Escape HTML special characters in text."""
        return html.escape(text)

    def row_to_html_string(self, row, tag='td'):
        """Convert a CSV row to an HTML formatted string, handling quotes and special characters."""
        cells = ''.join(f'<{tag}>{self.escape_html(cell)}</{tag}>' for cell in row)
        return f'<tr>{cells}</tr>'        

    def chunk_csv_to_html(self, byte_stream):
        # Read the CSV data from the byte stream
        byte_stream.seek(0)
        csv_reader = csv.reader(io.StringIO(byte_stream.read().decode('utf-8')))
        headers = next(csv_reader)
        header_html = self.row_to_html_string(headers, tag='th')
        header_tokens = self.count_tokens(header_html)

        # Initialize variables for chunking
        chunks = []
        current_chunk = f'<table>{header_html}'
        current_chunk_tokens = header_tokens

        for row in csv_reader:
            row_html = self.row_to_html_string(row)
            row_tokens = self.count_tokens(row_html)

            # Check if the row itself plus the header exceeds the max token limit
            if row_tokens + header_tokens > self.max_tokens:
                # Place the row in its own chunk without splitting it
                chunks.append(f'<table>{header_html}{row_html}</table>')
                current_chunk = f'<table>{header_html}'
                current_chunk_tokens = header_tokens
            else:
                # Check if adding this row would exceed the max token limit
                if current_chunk_tokens + row_tokens > self.max_tokens:
                    # Close the current table and start a new one
                    current_chunk += '</table>'
                    chunks.append(current_chunk)
                    current_chunk = f'<table>{header_html}{row_html}'
                    current_chunk_tokens = header_tokens + row_tokens
                else:
                    # Add the row to the current chunk
                    current_chunk += row_html
                    current_chunk_tokens += row_tokens

        # Add the last chunk
        if current_chunk.strip() != f'<table>{header_html}</table>':  # Avoid adding an empty chunk with only headers
            current_chunk += '</table>'
            chunks.append(current_chunk)

        return chunks

    def chunk_csv_to_csv(self, byte_stream):
        # Read the CSV data from the byte stream
        byte_stream.seek(0)
        csv_reader = csv.reader(io.StringIO(byte_stream.read().decode('utf-8')))
        headers = next(csv_reader)
        header_text = self.row_to_csv_string(headers)
        header_tokens = self.count_tokens(header_text)

        # Initialize variables for chunking
        chunks = []
        current_chunk = header_text
        current_chunk_tokens = header_tokens

        for row in csv_reader:
            row_text = self.row_to_csv_string(row)
            row_tokens = self.count_tokens(row_text)

            # Check if the row itself plus the header exceeds the max token limit
            if row_tokens + header_tokens > self.max_tokens:
                # Place the row in its own chunk without splitting it
                chunks.append(header_text + row_text)
                current_chunk = header_text
                current_chunk_tokens = header_tokens
            else:
                # Check if adding this row would exceed the max token limit
                if current_chunk_tokens + row_tokens > self.max_tokens:
                    # Save the current chunk and start a new one
                    chunks.append(current_chunk)
                    current_chunk = header_text + row_text
                    current_chunk_tokens = header_tokens + row_tokens
                else:
                    # Add the row to the current chunk
                    current_chunk += row_text
                    current_chunk_tokens += row_tokens

        # Add the last chunk
        if current_chunk.strip() != header_text.strip():  # Avoid adding an empty chunk with only headers
            chunks.append(current_chunk)

        return chunks


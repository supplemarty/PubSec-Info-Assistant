import os
import openai
from rich.console import Console
from tenacity import retry, wait_random_exponential, stop_after_attempt, wait_fixed

# openai.api_base = "https://Divco-OpenAI-02-US2.openai.azure.com/"
# openai.api_type = "azure"
# openai.api_key = "0684bcacf16b43749091850d28adab36"
# openai.api_version = "2023-12-01-preview"


#@retry(wait=wait_fixed(5), stop=stop_after_attempt(15))
def encode1(texts):
    """Embeds a list of texts using a given model"""
    response = openai.Embedding.create(
        engine="BI_ADA2",
        input=texts,
        api_base = "https://Divco-OpenAI-02-US2.openai.azure.com/",
        api_type = "azure",
        api_key = "0684bcacf16b43749091850d28adab36",
        api_version = "2023-12-01-preview"
    )
    return response
    
def encode2(texts):
    """Embeds a list of texts using a given model"""
    response = openai.Embedding.create(
        engine="BI_ADA",
        input=texts,
        api_base = "https://divco-openai-01.openai.azure.com/",
        api_type = "azure",
        api_key = "4a75db55c6c3445684d38d3e76287caf",
        api_version = "2023-12-01-preview"
    )
    return response

    

long_string = "Hi"

for i in range(2):
    e = encode1(long_string)
    print(i)
    print(e)
    e = encode2(long_string)
    print(e)


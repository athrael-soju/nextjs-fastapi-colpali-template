import base64
from io import BytesIO
from openai import OpenAI
from app.config import settings
import os


def encode_image_to_base64(image):
    """Encodes a PIL image to a base64 string."""
    buffered = BytesIO()
    image.save(buffered, format="JPEG")
    return base64.b64encode(buffered.getvalue()).decode("utf-8")


def query_openai(query, images, api_key, stream=False):
    """Calls OpenAI's GPT model with the query and image data."""
    
    if not api_key or not api_key.strip():
        raise ValueError("API key is required")
        
    if not api_key.startswith("sk-"):
        raise ValueError("Invalid OpenAI API key format")
        
    try:
        base64_images = [encode_image_to_base64(image[0]) for image in images]
        client = OpenAI(api_key=api_key.strip())
        PROMPT = """
You are a smart assistant designed to answer questions about a PDF document.
You are given relevant information in the form of PDF pages. Use them to construct a short response to the question, and cite your sources (page numbers, etc).
If it is not possible to answer using the provided pages, do not attempt to provide an answer and simply say the answer is not present within the documents.
Give detailed and extensive answers, only containing info in the pages you are given.
You can answer using information contained in plots and figures if necessary.
Answer in the same language as the query.

Query: {query}
PDF pages:
"""
        
        response = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": PROMPT.format(query=query)
                        }
                    ] + [
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{im}"
                            },
                        } for im in base64_images
                    ]
                }
            ],
            max_tokens=settings.MAX_TOKENS,
            stream=stream,
        )
        
        if stream:
            return response
        else:
            return response.choices[0].message.content
    except Exception as e:
        raise RuntimeError(f"Error calling OpenAI API: {str(e)}")

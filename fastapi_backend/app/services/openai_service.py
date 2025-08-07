import asyncio
import logging
from typing import List, Optional, Dict, Any
from openai import AsyncOpenAI
from PIL import Image
import io
import base64

from app.config import settings

logger = logging.getLogger(__name__)


class OpenAIService:
    """Service for interacting with OpenAI's Vision API"""

    def __init__(self):
        """Initialize OpenAI client"""
        if not settings.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY is required but not set")
        
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = settings.OPENAI_MODEL

    def _encode_image_to_base64(self, image: Image.Image) -> str:
        """
        Convert PIL Image to base64 string for OpenAI API
        
        Args:
            image: PIL Image object
            
        Returns:
            str: Base64 encoded image
        """
        try:
            # Convert image to bytes
            img_byte_arr = io.BytesIO()
            # Ensure image is in RGB format for JPEG
            if image.mode in ('RGBA', 'LA', 'P'):
                image = image.convert('RGB')
            image.save(img_byte_arr, format='JPEG', quality=85)
            img_byte_arr.seek(0)
            
            # Encode to base64
            img_base64 = base64.b64encode(img_byte_arr.getvalue()).decode('utf-8')
            return f"data:image/jpeg;base64,{img_base64}"
            
        except Exception as e:
            logger.error(f"Error encoding image to base64: {e}")
            raise Exception(f"Failed to encode image: {e}")

    def _format_images_for_openai(self, images: List[Image.Image]) -> List[Dict[str, Any]]:
        """
        Format images for OpenAI Vision API
        
        Args:
            images: List of PIL Image objects
            
        Returns:
            List[Dict]: Formatted image content for OpenAI API
        """
        formatted_images = []
        
        for i, image in enumerate(images):
            try:
                base64_image = self._encode_image_to_base64(image)
                formatted_images.append({
                    "type": "image_url",
                    "image_url": {
                        "url": base64_image,
                        "detail": "auto"  # Can be "low", "high", or "auto"
                    }
                })
            except Exception as e:
                logger.warning(f"Failed to encode image {i}: {e}")
                continue
                
        return formatted_images

    async def analyze_images_with_prompt(
        self, 
        prompt: str, 
        images: List[Image.Image],
        system_message: Optional[str] = None
    ) -> str:
        """
        Analyze images using OpenAI Vision API with a user prompt
        
        Args:
            prompt: User's question/prompt about the images
            images: List of PIL Image objects to analyze
            system_message: Optional system message to guide the model
            
        Returns:
            str: OpenAI's response analyzing the images
        """
        try:
            if not images:
                raise ValueError("At least one image is required")
            
            if not prompt.strip():
                raise ValueError("Prompt cannot be empty")

            # Format images for OpenAI API
            formatted_images = self._format_images_for_openai(images)
            
            if not formatted_images:
                raise ValueError("No valid images could be processed")

            # Prepare the content for the user message
            content = [{"type": "text", "text": prompt}]
            content.extend(formatted_images)

            # Prepare messages
            messages = []
            
            # Add system message if provided
            if system_message:
                messages.append({
                    "role": "system",
                    "content": system_message
                })
            
            # Add user message with prompt and images
            messages.append({
                "role": "user",
                "content": content
            })

            # Make API call to OpenAI
            logger.info(f"Making OpenAI API call with {len(formatted_images)} images")
            
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_tokens=1000,  # Adjust as needed
                temperature=0.7,  # Adjust for creativity vs consistency
            )

            # Extract response text
            if response.choices and response.choices[0].message:
                response_text = response.choices[0].message.content
                logger.info("Successfully received response from OpenAI")
                return response_text or "No response generated"
            else:
                raise Exception("No response received from OpenAI")

        except Exception as e:
            logger.error(f"Error calling OpenAI Vision API: {e}")
            raise Exception(f"Failed to analyze images: {e}")

    async def conversational_analysis(
        self, 
        prompt: str, 
        images: List[Image.Image],
        context: Optional[str] = None
    ) -> str:
        """
        Perform conversational analysis of images with enhanced context
        
        Args:
            prompt: User's conversational prompt
            images: List of retrieved images from vector search
            context: Optional context about the retrieved images
            
        Returns:
            str: Conversational response from OpenAI
        """
        # Enhanced system message for conversational analysis
        system_message = """You are an AI assistant helping users analyze and understand document images. 
        The user has asked a question, and you have been provided with relevant images retrieved from their document collection.
        
        Your task is to:
        1. Analyze the provided images carefully
        2. Answer the user's question based on what you can see in the images
        3. Be specific and reference details from the images when relevant
        4. If the images don't contain enough information to fully answer the question, acknowledge this
        5. Provide helpful insights and context where possible
        
        Be conversational and helpful in your response."""

        # Add context information if available
        if context:
            enhanced_prompt = f"Context about retrieved images: {context}\n\nUser question: {prompt}"
        else:
            enhanced_prompt = prompt

        return await self.analyze_images_with_prompt(
            prompt=enhanced_prompt,
            images=images,
            system_message=system_message
        )

    async def health_check(self) -> bool:
        """
        Check if OpenAI service is accessible
        
        Returns:
            bool: True if service is accessible, False otherwise
        """
        try:
            # Make a simple API call to test connectivity
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": "Hello"}],
                max_tokens=5
            )
            
            if response.choices:
                logger.info("OpenAI service health check passed")
                return True
            else:
                logger.warning("OpenAI service health check failed: no response")
                return False
                
        except Exception as e:
            logger.error(f"OpenAI service health check failed: {e}")
            return False

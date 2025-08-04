import io
import json
import uuid
from datetime import timedelta
from minio import Minio
from minio.error import S3Error
from PIL import Image, ImageOps
import logging
from typing import Tuple

from app.config import settings

# Configure logging
logger = logging.getLogger(__name__)


class MinioService:
    """Service for storing and retrieving images from MinIO object storage"""

    def __init__(self):
        """Initialize MinIO client and create bucket if it doesn't exist"""
        try:
            # Parse MinIO URL to get endpoint
            url_parts = settings.MINIO_URL.replace("http://", "").replace(
                "https://", ""
            )
            self.endpoint = url_parts
            self.secure = settings.MINIO_URL.startswith("https://")

            # Initialize MinIO client
            self.client = Minio(
                self.endpoint,
                access_key=settings.MINIO_ACCESS_KEY,
                secret_key=settings.MINIO_SECRET_KEY,
                secure=self.secure,
            )

            self.bucket_name = settings.MINIO_BUCKET_NAME

            # Create bucket if it doesn't exist
            self._create_bucket_if_not_exists()

            logger.info(f"MinIO service initialized with bucket: {self.bucket_name}")

        except Exception as e:
            raise Exception(f"Failed to initialize MinIO service: {e}")

    def _create_bucket_if_not_exists(self):
        """Create MinIO bucket if it doesn't exist"""
        try:
            if not self.client.bucket_exists(self.bucket_name):
                self.client.make_bucket(self.bucket_name)
                logger.info(f"Created bucket: {self.bucket_name}")
            else:
                logger.info(f"Bucket already exists: {self.bucket_name}")
            self.set_public_policy()
        except S3Error as e:
            raise Exception(f"Error creating bucket {self.bucket_name}: {e}")

    def _generate_thumbnail(self, image: Image.Image, size: Tuple[int, int] = (300, 200)) -> Image.Image:
        """Generate a thumbnail from a PIL Image
        
        Args:
            image: PIL Image to generate thumbnail from
            size: Target size as (width, height)
            
        Returns:
            PIL.Image: Thumbnail image
        """
        # Create a thumbnail that maintains aspect ratio
        img = image.copy()
        img.thumbnail(size, Image.Resampling.LANCZOS)
        
        # Create a new image with white background
        thumb = Image.new('RGB', size, (255, 255, 255))
        
        # Calculate position to center the thumbnail
        x = (size[0] - img.size[0]) // 2
        y = (size[1] - img.size[1]) // 2
        
        # Paste the thumbnail onto the white background
        thumb.paste(img, (x, y))
        return thumb

    def store_image(self, image: Image.Image, image_id: str = None, generate_thumbnail: bool = True) -> dict:
        """
        Store a PIL Image in MinIO and optionally generate/store a thumbnail

        Args:
            image: PIL Image object to store
            image_id: Optional custom ID for the image, generates UUID if not provided
            generate_thumbnail: Whether to generate and store a thumbnail

        Returns:
            dict: Dictionary containing full image URL and thumbnail URL if generated
        """
        if image_id is None:
            image_id = str(uuid.uuid4())

        try:
            # Store full image
            full_img_buffer = io.BytesIO()
            image.save(full_img_buffer, format="PNG")
            full_img_buffer.seek(0)

            full_object_name = f"images/{image_id}.png"
            self.client.put_object(
                self.bucket_name,
                full_object_name,
                full_img_buffer,
                length=full_img_buffer.getbuffer().nbytes,
                content_type="image/png",
            )
            full_url = f"{settings.MINIO_URL}/{self.bucket_name}/{full_object_name}"
            
            result = {
                'id': image_id,
                'url': full_url,
                'thumbnail_url': None
            }
            
            # Generate and store thumbnail if requested
            if generate_thumbnail:
                try:
                    thumbnail = self._generate_thumbnail(image)
                    thumb_buffer = io.BytesIO()
                    thumbnail.save(thumb_buffer, format="PNG")
                    thumb_buffer.seek(0)
                    
                    thumb_object_name = f"thumbs/{image_id}.png"
                    self.client.put_object(
                        self.bucket_name,
                        thumb_object_name,
                        thumb_buffer,
                        length=thumb_buffer.getbuffer().nbytes,
                        content_type="image/png",
                    )
                    result['thumbnail_url'] = f"{settings.MINIO_URL}/{self.bucket_name}/{thumb_object_name}"
                except Exception as e:
                    logger.error(f"Error generating thumbnail for {image_id}: {e}")
            
            logger.info(f"Image stored successfully: {result}")
            return result

        except Exception as e:
            logger.error(f"Error storing image {image_id}: {e}")
            raise Exception(f"Failed to store image: {e}")

    def get_image(self, image_id: str) -> Image.Image:
        """
        Retrieve a PIL Image from MinIO by image ID

        Args:
            image_id: The ID of the image to retrieve

        Returns:
            PIL.Image.Image: The retrieved image
        """
        try:
            object_name = f"images/{image_id}.png"

            # Get object from MinIO
            response = self.client.get_object(self.bucket_name, object_name)

            # Convert to PIL Image
            image = Image.open(io.BytesIO(response.data))

            logger.info(f"Image retrieved successfully: {image_id}")
            return image

        except Exception as e:
            logger.error(f"Error retrieving image {image_id}: {e}")
            raise Exception(f"Failed to retrieve image: {e}")
        finally:
            if "response" in locals():
                response.close()
                response.release_conn()

    def delete_image(self, image_id: str) -> bool:
        """
        Delete an image from MinIO by image ID

        Args:
            image_id: The ID of the image to delete

        Returns:
            bool: True if successful, False otherwise
        """
        try:
            object_name = f"images/{image_id}.png"

            self.client.remove_object(self.bucket_name, object_name)

            logger.info(f"Image deleted successfully: {image_id}")
            return True

        except Exception as e:
            logger.error(f"Error deleting image {image_id}: {e}")
            return False

    def store_metadata(self, image_id: str, metadata: dict) -> str:
        """
        Store metadata for an image as a JSON file

        Args:
            image_id: The ID of the image
            metadata: Dictionary containing metadata

        Returns:
            str: URL to access the stored metadata
        """
        try:
            metadata_json = json.dumps(metadata, indent=2)
            metadata_buffer = io.BytesIO(metadata_json.encode("utf-8"))

            object_name = f"metadata/{image_id}.json"

            # Upload metadata to MinIO
            self.client.put_object(
                self.bucket_name,
                object_name,
                metadata_buffer,
                length=len(metadata_json),
                content_type="application/json",
            )

            url = f"{settings.MINIO_URL}/{self.bucket_name}/{object_name}"
            logger.info(f"Metadata stored successfully: {url}")
            return url

        except Exception as e:
            logger.error(f"Error storing metadata for {image_id}: {e}")
            raise Exception(f"Failed to store metadata: {e}")

    def get_metadata(self, image_id: str) -> dict:
        """
        Retrieve metadata for an image

        Args:
            image_id: The ID of the image

        Returns:
            dict: The metadata dictionary
        """
        try:
            object_name = f"metadata/{image_id}.json"

            # Get metadata from MinIO
            response = self.client.get_object(self.bucket_name, object_name)
            metadata_json = response.data.decode("utf-8")
            metadata = json.loads(metadata_json)

            logger.info(f"Metadata retrieved successfully: {image_id}")
            return metadata

        except Exception as e:
            logger.error(f"Error retrieving metadata for {image_id}: {e}")
            raise Exception(f"Failed to retrieve metadata: {e}")
        finally:
            if "response" in locals():
                response.close()
                response.release_conn()

    def list_images(self, prefix: str = "images/") -> list:
        """
        List all images in the bucket

        Args:
            prefix: Prefix to filter objects (default: "images/")

        Returns:
            list: List of image object names
        """
        try:
            objects = self.client.list_objects(self.bucket_name, prefix=prefix)
            image_list = [obj.object_name for obj in objects]

            logger.info(f"Found {len(image_list)} images in bucket")
            return image_list

        except Exception as e:
            logger.error(f"Error listing images: {e}")
            return []

    def set_public_policy(self):
        """Set bucket policy to allow public read access"""
        try:
            policy = {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {"AWS": "*"},
                        "Action": ["s3:GetObject"],
                        "Resource": [f"arn:aws:s3:::{self.bucket_name}/*"],
                    }
                ],
            }

            policy_json = json.dumps(policy)
            self.client.set_bucket_policy(self.bucket_name, policy_json)
            logger.info(f"Public read policy set for bucket: {self.bucket_name}")

        except Exception as e:
            logger.warning(
                f"Could not set public policy for bucket {self.bucket_name}: {e}"
            )

    def health_check(self) -> bool:
        """
        Check if MinIO service is accessible

        Returns:
            bool: True if service is accessible, False otherwise
        """
        try:
            # Try to list buckets to check connectivity
            buckets = self.client.list_buckets()
            logger.info(f"MinIO health check passed. Found {len(buckets)} buckets")
            return True
        except Exception as e:
            logger.error(f"MinIO health check failed: {e}")
            return False

    def get_presigned_url(
        self, image_id: str, expires: timedelta = timedelta(hours=1)
    ) -> str:
        """
        Generate a presigned URL for temporary access to an image

        Args:
            image_id: The ID of the image
            expires: How long the URL should be valid (default: 1 hour)

        Returns:
            str: Presigned URL for the image
        """
        try:
            object_name = f"images/{image_id}.png"

            url = self.client.presigned_get_object(
                self.bucket_name, object_name, expires=expires
            )

            logger.info(f"Generated presigned URL for {image_id}")
            return url

        except Exception as e:
            logger.error(f"Error generating presigned URL for {image_id}: {e}")
            raise Exception(f"Failed to generate presigned URL: {e}")

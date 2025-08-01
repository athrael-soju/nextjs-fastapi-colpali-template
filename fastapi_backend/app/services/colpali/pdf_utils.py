from pdf2image import convert_from_path


def convert_files_to_images(files):
    """Convert uploaded PDF files to PIL images"""
    images = []
    for file in files:
        # Convert PDF to images
        file_images = convert_from_path(file)
        images.extend(file_images)
    return images

"""Custom exceptions for ColPali service"""


class ColPaliServiceError(Exception):
    """Base exception for ColPali service errors"""
    pass


class ModelLoadError(ColPaliServiceError):
    """Raised when model fails to load"""
    pass


class StorageServiceError(ColPaliServiceError):
    """Raised when storage service fails"""
    pass


class DocumentIndexingError(ColPaliServiceError):
    """Raised when document indexing fails"""
    pass


class DocumentSearchError(ColPaliServiceError):
    """Raised when document search fails"""
    pass


class InvalidConfigurationError(ColPaliServiceError):
    """Raised when configuration is invalid"""
    pass

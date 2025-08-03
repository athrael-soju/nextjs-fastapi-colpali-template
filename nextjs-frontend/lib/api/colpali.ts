/**
 * ColPali API service for document search and management
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export interface SearchRequest {
  query: string;
  k?: number;
  api_key?: string;
}

export interface SearchResult {
  rank: number;
  page_info: string;
  image_size?: [number, number];
  image_url?: string;
  thumbnail_url?: string;
}

export interface SearchResponse {
  status: string;
  query?: string;
  results?: SearchResult[];
  total_results?: number;
  ai_response?: string;
  message?: string;
}

export interface IndexResponse {
  status: string;
  message: string;
  indexed_pages?: number;
}

export interface CollectionInfoResponse {
  status: string;
  storage_type?: string;
  indexed_documents?: number;
  indexed_images?: number;
  collection_info?: any;
  message?: string;
}

// Get authentication token from localStorage or cookie
const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  // Try to get token from localStorage first (adjust key as needed)
  const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');
  if (token) return token;
  
  // Fallback to checking cookies
  const cookieToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('access_token='))
    ?.split('=')[1];
    
  return cookieToken || null;
};

// Create headers with authentication
const createHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

export class ColPaliAPI {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Search indexed documents
   */
  async searchDocuments(request: SearchRequest): Promise<SearchResponse> {
    const response = await fetch(`${this.baseUrl}/colpali/search`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Search failed: ${response.status} ${errorText}`);
    }

    return response.json();
  }

  /**
   * Index PDF documents
   */
  async indexDocuments(files: FileList | File[]): Promise<IndexResponse> {
    const formData = new FormData();
    
    Array.from(files).forEach((file) => {
      formData.append('files', file);
    });

    const headers: HeadersInit = {};
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}/colpali/index`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Indexing failed: ${response.status} ${errorText}`);
    }

    return response.json();
  }

  /**
   * Get collection information
   */
  async getCollectionInfo(): Promise<CollectionInfoResponse> {
    const response = await fetch(`${this.baseUrl}/colpali/info`, {
      method: 'GET',
      headers: createHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get collection info: ${response.status} ${errorText}`);
    }

    return response.json();
  }

  /**
   * Clear all indexed documents
   */
  async clearCollection(): Promise<{ status: string; message: string }> {
    const response = await fetch(`${this.baseUrl}/colpali/clear`, {
      method: 'DELETE',
      headers: createHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to clear collection: ${response.status} ${errorText}`);
    }

    return response.json();
  }

  /**
   * Get image by ID
   */
  getImageUrl(imageId: string): string {
    return `${this.baseUrl}/colpali/image/${imageId}`;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; message: string }> {
    const response = await fetch(`${this.baseUrl}/colpali/health`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }

    return response.json();
  }
}

// Default instance
export const colpaliAPI = new ColPaliAPI();

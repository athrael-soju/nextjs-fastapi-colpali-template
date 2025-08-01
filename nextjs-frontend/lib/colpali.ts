import {
  indexDocumentsAction,
  searchDocumentsAction,
  getCollectionInfoAction,
  clearCollectionAction,
  healthCheckAction,
} from "@/components/actions/colpali-action";
import type {
  IndexResponse,
  SearchResponse,
  CollectionInfoResponse,
  ClearResponse,
} from "@/app/clientService";

/**
 * ColPali service for document indexing and search functionality
 */
export class ColPaliService {
  /**
   * Index PDF documents for search
   */
  async indexDocuments(files: File[]): Promise<IndexResponse> {
    return await indexDocumentsAction(files);
  }

  /**
   * Search indexed documents
   */
  async searchDocuments(
    query: string,
    k: number = 5,
    apiKey?: string
  ): Promise<SearchResponse> {
    return await searchDocumentsAction(query, k, apiKey);
  }

  /**
   * Get information about the current document collection
   */
  async getCollectionInfo(): Promise<CollectionInfoResponse> {
    return await getCollectionInfoAction();
  }

  /**
   * Clear all indexed documents
   */
  async clearCollection(): Promise<ClearResponse> {
    return await clearCollectionAction();
  }

  /**
   * Health check for ColPali service
   */
  async healthCheck(): Promise<unknown> {
    return await healthCheckAction();
  }
}

// Export a singleton instance
export const colpaliService = new ColPaliService();

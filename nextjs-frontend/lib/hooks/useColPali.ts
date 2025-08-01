import { useState, useCallback } from 'react';
import { colpaliService } from '@/lib/colpali';
import type { 
  CollectionInfoResponse, 
  SearchResult 
} from '@/app/clientService';

export interface ColPaliState {
  // Loading states
  indexing: boolean;
  searching: boolean;
  loading: boolean;
  
  // Data
  searchResults: SearchResult[];
  collectionInfo: CollectionInfoResponse | null;
  aiResponse: string;
  
  // UI state
  message: string;
  error: string | null;
}

export function useColPali() {
  const [state, setState] = useState<ColPaliState>({
    indexing: false,
    searching: false,
    loading: false,
    searchResults: [],
    collectionInfo: null,
    aiResponse: '',
    message: '',
    error: null,
  });

  const setMessage = useCallback((message: string, isError = false) => {
    setState(prev => ({
      ...prev,
      message,
      error: isError ? message : null,
    }));
  }, []);

  const clearMessage = useCallback(() => {
    setState(prev => ({
      ...prev,
      message: '',
      error: null,
    }));
  }, []);

  const indexDocuments = useCallback(async (files: File[]) => {
    if (files.length === 0) {
      setMessage('Please select PDF files to index', true);
      return false;
    }

    setState(prev => ({ ...prev, indexing: true }));
    clearMessage();

    try {
      const result = await colpaliService.indexDocuments(files);
      if (result.status === 'success') {
        setMessage(`Successfully indexed ${result.indexed_pages} pages from ${files.length} documents`);
        return true;
      } else {
        setMessage(result.message || 'Failed to index documents', true);
        return false;
      }
    } catch (error) {
      setMessage(`Error indexing documents: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
      return false;
    } finally {
      setState(prev => ({ ...prev, indexing: false }));
    }
  }, [setMessage, clearMessage]);

  const searchDocuments = useCallback(async (query: string, k = 5) => {
    if (!query.trim()) {
      setMessage('Please enter a search query', true);
      return false;
    }

    setState(prev => ({ 
      ...prev, 
      searching: true,
      searchResults: [],
      aiResponse: '',
    }));
    clearMessage();

    try {
      const result = await colpaliService.searchDocuments(query, k);
      if (result.status === 'success') {
        setState(prev => ({
          ...prev,
          searchResults: result.results || [],
          aiResponse: result.ai_response || '',
        }));
        setMessage(result.total_results ? `Found ${result.total_results} results` : 'Search completed');
        return true;
      } else {
        setMessage(result.message || 'Search failed', true);
        return false;
      }
    } catch (error) {
      setMessage(`Error searching documents: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
      return false;
    } finally {
      setState(prev => ({ ...prev, searching: false }));
    }
  }, [setMessage, clearMessage]);

  const getCollectionInfo = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true }));
    
    try {
      const info = await colpaliService.getCollectionInfo();
      setState(prev => ({ ...prev, collectionInfo: info }));
      return info;
    } catch (error) {
      setMessage(`Error getting collection info: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
      return null;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [setMessage]);

  const clearCollection = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true }));
    clearMessage();

    try {
      const result = await colpaliService.clearCollection();
      if (result.status === 'success') {
        setState(prev => ({
          ...prev,
          collectionInfo: null,
          searchResults: [],
          aiResponse: '',
        }));
        setMessage('Collection cleared successfully');
        return true;
      } else {
        setMessage(result.message || 'Failed to clear collection', true);
        return false;
      }
    } catch (error) {
      setMessage(`Error clearing collection: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
      return false;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [setMessage, clearMessage]);

  const healthCheck = useCallback(async () => {
    try {
      await colpaliService.healthCheck();
      return true;
    } catch (error) {
      setMessage(`Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
      return false;
    }
  }, [setMessage]);

  return {
    ...state,
    actions: {
      indexDocuments,
      searchDocuments,
      getCollectionInfo,
      clearCollection,
      healthCheck,
      setMessage,
      clearMessage,
    },
  };
}

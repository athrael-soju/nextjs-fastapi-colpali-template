"use server";

import { cookies } from "next/headers";
import { 
  indexDocuments, 
  searchDocuments, 
  getCollectionInfo, 
  clearCollection, 
  healthCheck,
  getProgressStream,
  getProgressStatus,
  chatWithImages,
} from "@/app/clientService";
import type {
  SearchResponse,
  CollectionInfoResponse,
  ClearResponse,
  SearchRequest,
} from "@/app/clientService";

async function getAuthToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;
  
  if (!token) {
    throw new Error("No access token found. Please log in.");
  }
  
  return token;
}

export async function indexDocumentsAction(files: File[]): Promise<{task_id: string; status: string; message: string}> {
  const token = await getAuthToken();
  
  const { data, error } = await indexDocuments({
    body: {
      files: files,
    },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (error) {
    throw new Error(`Index operation failed: ${JSON.stringify(error)}`);
  }

  if (!data) {
    throw new Error("No data received from index operation");
  }

  return data as {task_id: string; status: string; message: string};
}

export async function searchDocumentsAction(
  query: string,
  k: number = 5,
  apiKey?: string
): Promise<SearchResponse> {
  const token = await getAuthToken();
  
  const searchRequest: SearchRequest = {
    query,
    k,
    api_key: apiKey,
  };

  const { data, error } = await searchDocuments({
    body: searchRequest,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (error) {
    throw new Error(`Search operation failed: ${JSON.stringify(error)}`);
  }

  if (!data) {
    throw new Error("No data received from search operation");
  }

  return data;
}

export async function getCollectionInfoAction(): Promise<CollectionInfoResponse> {
  const token = await getAuthToken();
  
  const { data, error } = await getCollectionInfo({
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (error) {
    throw new Error(`Collection info operation failed: ${JSON.stringify(error)}`);
  }

  if (!data) {
    throw new Error("No data received from collection info operation");
  }

  return data;
}

export async function clearCollectionAction(): Promise<ClearResponse> {
  const token = await getAuthToken();
  
  const { data, error } = await clearCollection({
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (error) {
    throw new Error(`Clear collection operation failed: ${JSON.stringify(error)}`);
  }

  if (!data) {
    throw new Error("No data received from clear collection operation");
  }

  return data;
}

export async function healthCheckAction(): Promise<unknown> {
  // Health check doesn't require authentication
  const { data, error } = await healthCheck();

  if (error) {
    throw new Error(`Health check failed: ${JSON.stringify(error)}`);
  }

  return data;
}

export async function getProgressStreamAction(taskId: string): Promise<any> {
  const token = await getAuthToken();
  
  const { data, error } = await getProgressStream({
    path: {
      task_id: taskId,
    },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (error) {
    throw new Error(`Progress stream failed: ${JSON.stringify(error)}`);
  }

  return data;
}

export async function getProgressStatusAction(taskId: string): Promise<any> {
  const token = await getAuthToken();
  
  const { data, error } = await getProgressStatus({
    path: {
      task_id: taskId,
    },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (error) {
    throw new Error(`Progress status failed: ${JSON.stringify(error)}`);
  }

  return data;
}

export async function chatWithImagesAction(
  query: string,
  imageIds: string[],
  apiKey?: string
): Promise<ReadableStream<Uint8Array>> {
  const token = await getAuthToken();
  
  const chatRequest = {
    query,
    image_ids: imageIds,
    api_key: apiKey,
  };

  // Use fetch directly for streaming support instead of the OpenAPI client
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
  const response = await fetch(`${baseUrl}/colpali/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(chatRequest),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage;
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.detail || errorText;
    } catch {
      errorMessage = errorText;
    }
    throw new Error(`Chat request failed: ${errorMessage}`);
  }

  if (!response.body) {
    throw new Error('No response body received from streaming endpoint');
  }

  return response.body;
}

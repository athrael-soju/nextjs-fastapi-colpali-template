"use server";

import { cookies } from "next/headers";
import { 
  indexDocuments, 
  searchDocuments, 
  getCollectionInfo, 
  clearCollection, 
  healthCheck 
} from "@/app/clientService";
import type {
  IndexResponse,
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

export async function indexDocumentsAction(files: File[]): Promise<IndexResponse> {
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

  return data;
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

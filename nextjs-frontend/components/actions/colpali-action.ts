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
  conversationalChat,
} from "@/app/clientService";
import type {
  SearchResponse,
  CollectionInfoResponse,
  ClearResponse,
  SearchRequest,
  ConversationRequest,
  ConversationResponse,
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
  k: number = 5
): Promise<SearchResponse> {
  const token = await getAuthToken();
  
  const searchRequest: SearchRequest = {
    query,
    k,
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

export async function conversationalChatAction(
  prompt: string,
  topK: number = 5
): Promise<ConversationResponse> {
  const token = await getAuthToken();
  
  const conversationRequest: ConversationRequest = {
    prompt,
    top_k: topK,
  };

  const { data, error } = await conversationalChat({
    body: conversationRequest,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (error) {
    throw new Error(`Conversation operation failed: ${JSON.stringify(error)}`);
  }

  if (!data) {
    throw new Error("No data received from conversation operation");
  }

  return data;
}

 

import { DocumentItem, User, DocumentShare } from '../types';

const API_BASE = (import.meta as any).env?.VITE_API_BASE || '/api';

function getHeaders(userId: string, isJson = true): HeadersInit {
  const headers: Record<string, string> = {
    'x-user-id': userId,
  };
  if (isJson) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMessage = data.error || `Request failed with status ${res.status}`;
    throw new Error(errorMessage);
  }
  return data as T;
}

export async function fetchUsers(): Promise<User[]> {
  const res = await fetch(`${API_BASE}/users`);
  return handleResponse<User[]>(res);
}

export async function fetchDocuments(userId: string): Promise<{ owned: DocumentItem[]; shared: DocumentItem[] }> {
  const res = await fetch(`${API_BASE}/documents`, {
    headers: getHeaders(userId),
  });
  return handleResponse<{ owned: DocumentItem[]; shared: DocumentItem[] }>(res);
}

export async function fetchDocumentById(id: string, userId: string): Promise<DocumentItem> {
  const res = await fetch(`${API_BASE}/documents/${id}`, {
    headers: getHeaders(userId),
  });
  return handleResponse<DocumentItem>(res);
}

export async function createDocument(
  userId: string,
  payload?: { title?: string; content?: string }
): Promise<DocumentItem> {
  const res = await fetch(`${API_BASE}/documents`, {
    method: 'POST',
    headers: getHeaders(userId),
    body: JSON.stringify(payload || {}),
  });
  return handleResponse<DocumentItem>(res);
}

export async function updateDocument(
  id: string,
  userId: string,
  payload: { title?: string; content?: string }
): Promise<DocumentItem> {
  const res = await fetch(`${API_BASE}/documents/${id}`, {
    method: 'PUT',
    headers: getHeaders(userId),
    body: JSON.stringify(payload),
  });
  return handleResponse<DocumentItem>(res);
}

export async function deleteDocument(id: string, userId: string): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/documents/${id}`, {
    method: 'DELETE',
    headers: getHeaders(userId),
  });
  return handleResponse<{ message: string }>(res);
}

export async function shareDocument(
  id: string,
  userId: string,
  targetUserId: string
): Promise<DocumentShare> {
  const res = await fetch(`${API_BASE}/documents/${id}/share`, {
    method: 'POST',
    headers: getHeaders(userId),
    body: JSON.stringify({ userId: targetUserId }),
  });
  return handleResponse<DocumentShare>(res);
}

export async function fetchShares(id: string, userId: string): Promise<DocumentShare[]> {
  const res = await fetch(`${API_BASE}/documents/${id}/shares`, {
    headers: getHeaders(userId),
  });
  return handleResponse<DocumentShare[]>(res);
}

export async function uploadDocument(file: File, userId: string): Promise<DocumentItem> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers: getHeaders(userId, false),
    body: formData,
  });

  return handleResponse<DocumentItem>(res);
}

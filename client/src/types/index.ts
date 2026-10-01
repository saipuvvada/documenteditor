export interface User {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
}

export interface DocumentShare {
  id: string;
  documentId: string;
  userId: string;
  user: User;
  createdAt: string;
}

export interface DocumentItem {
  id: string;
  title: string;
  content: string;
  ownerId: string;
  owner: User;
  shares?: DocumentShare[];
  createdAt: string;
  updatedAt: string;
  accessRole?: 'owner' | 'shared';
}

export type SaveStatus = 'saved' | 'saving' | 'failed' | 'unsaved';

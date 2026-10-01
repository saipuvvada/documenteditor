import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  UploadCloud,
  FileText,
  Clock,
  User,
  Share2,
  Trash2,
  Search,
  Loader2,
  AlertCircle,
  FileCode,
} from 'lucide-react';
import { DocumentItem } from '../types';
import { fetchDocuments, createDocument, deleteDocument } from '../services/api';
import { useDemoUser } from '../context/DemoUserContext';
import { UploadModal } from './UploadModal';

interface DashboardProps {
  onOpenDocument: (documentId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onOpenDocument }) => {
  const { currentUser } = useDemoUser();

  const [ownedDocs, setOwnedDocs] = useState<DocumentItem[]>([]);
  const [sharedDocs, setSharedDocs] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchDocuments(currentUser.id);
      setOwnedDocs(data.owned || []);
      setSharedDocs(data.shared || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser.id]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Handle New Document creation
  const handleCreateDocument = async () => {
    setIsCreating(true);
    setError(null);
    try {
      const newDoc = await createDocument(currentUser.id, {
        title: 'Untitled document',
        content: '<p></p>',
      });
      onOpenDocument(newDoc.id);
    } catch (err: any) {
      setError(err.message || 'Unable to create a new document. Please try again.');
      setIsCreating(false);
    }
  };

  // Handle Document deletion
  const handleDeleteDocument = async (e: React.MouseEvent, docId: string, title: string) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    try {
      await deleteDocument(docId, currentUser.id);
      await loadDocuments();
    } catch (err: any) {
      alert(err.message || 'Failed to delete document');
    }
  };

  // Format date helper
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (diffSeconds < 60) return 'Just now';
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} mins ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} hours ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Filter documents by search query
  const filteredOwned = ownedDocs.filter((d) =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredShared = sharedDocs.filter((d) =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Action Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome back, {currentUser.name}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Create, upload, and collaborate on your documents in real-time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleCreateDocument}
            disabled={isCreating}
            className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition flex items-center space-x-2 disabled:opacity-50"
          >
            {isCreating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Plus className="w-5 h-5" />
            )}
            <span>New Document</span>
          </button>

          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm border border-slate-300/80 transition flex items-center space-x-2"
          >
            <UploadCloud className="w-5 h-5 text-slate-600" />
            <span>Upload File</span>
          </button>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center space-x-3 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search documents by title..."
          className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs text-sm"
        />
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-3" />
          <p className="text-slate-500 text-sm">Fetching your documents...</p>
        </div>
      ) : (
        <div className="space-y-10">
          {/* SECTION 1: My Documents */}
          <section>
            <div className="flex items-center space-x-3 mb-4">
              <h2 className="text-xl font-bold text-slate-900">My Documents</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                {ownedDocs.length}
              </span>
            </div>

            {filteredOwned.length === 0 ? (
              <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-8 text-center">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="font-bold text-slate-700 text-base">No documents created yet</p>
                <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto">
                  Click "New Document" or "Upload File" to start writing and editing.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredOwned.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => onOpenDocument(doc.id)}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-blue-300 transition cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
                          <FileText className="w-6 h-6" />
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          Owned by me
                        </span>
                      </div>

                      <h3 className="font-bold text-slate-900 text-base mt-4 line-clamp-1 group-hover:text-blue-600 transition">
                        {doc.title}
                      </h3>

                      {doc.shares && doc.shares.length > 0 && (
                        <div className="flex items-center text-xs text-indigo-600 mt-2 font-medium">
                          <Share2 className="w-3.5 h-3.5 mr-1" />
                          <span>Shared with {doc.shares.length} user{doc.shares.length > 1 ? 's' : ''}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1" />
                        {formatDate(doc.updatedAt)}
                      </span>

                      <button
                        onClick={(e) => handleDeleteDocument(e, doc.id, doc.title)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                        title="Delete Document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* SECTION 2: Shared With Me */}
          <section>
            <div className="flex items-center space-x-3 mb-4">
              <h2 className="text-xl font-bold text-slate-900">Shared With Me</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                {sharedDocs.length}
              </span>
            </div>

            {filteredShared.length === 0 ? (
              <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-8 text-center">
                <Share2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="font-bold text-slate-700 text-base">No shared documents</p>
                <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto">
                  Documents shared with you by other demo users will appear here. Switch demo users in the top header to test sharing!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredShared.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => onOpenDocument(doc.id)}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-emerald-300 transition cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition">
                          <FileCode className="w-6 h-6" />
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Shared Access
                        </span>
                      </div>

                      <h3 className="font-bold text-slate-900 text-base mt-4 line-clamp-1 group-hover:text-emerald-600 transition">
                        {doc.title}
                      </h3>

                      <div className="flex items-center text-xs text-slate-500 mt-2">
                        <User className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        <span>Owner: <strong className="text-slate-700">{doc.owner?.name}</strong></span>
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1" />
                        {formatDate(doc.updatedAt)}
                      </span>

                      <span className="text-emerald-600 font-semibold text-xs">Can edit</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={(newDoc) => onOpenDocument(newDoc.id)}
      />
    </div>
  );
};

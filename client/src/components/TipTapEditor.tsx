import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';

import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Undo,
  Redo,
  ArrowLeft,
  Save,
  Share2,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';

import { DocumentItem, SaveStatus } from '../types';
import { updateDocument, fetchDocumentById } from '../services/api';
import { useDemoUser } from '../context/DemoUserContext';
import { ShareModal } from './ShareModal';

interface TipTapEditorProps {
  documentId: string;
  onBackToDashboard: () => void;
}

export const TipTapEditor: React.FC<TipTapEditorProps> = ({
  documentId,
  onBackToDashboard,
}) => {
  const { currentUser } = useDemoUser();

  const [document, setDocument] = useState<DocumentItem | null>(null);
  const [title, setTitle] = useState<string>('');
  const [isLoadingDoc, setIsLoadingDoc] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);

  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoadRef = useRef<boolean>(true);

  // Function to save document to backend
  const performSave = useCallback(
    async (newTitle: string, newContent: string) => {
      if (!documentId) return;

      setSaveStatus('saving');
      setSaveErrorMessage(null);

      try {
        const updatedDoc = await updateDocument(documentId, currentUser.id, {
          title: newTitle,
          content: newContent,
        });
        setDocument(updatedDoc);
        setSaveStatus('saved');
      } catch (err: any) {
        console.error('Autosave error:', err);
        setSaveStatus('failed');
        setSaveErrorMessage(err.message || 'Unable to save the document. Please try again.');
      }
    },
    [documentId, currentUser.id]
  );

  // Initialize TipTap Editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2],
        },
      }),
      Underline,
    ],
    content: '',
    onUpdate: ({ editor }) => {
      if (isInitialLoadRef.current) return;

      setSaveStatus('unsaved');

      // Schedule debounced autosave (1000ms)
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        const currentHtml = editor.getHTML();
        performSave(title, currentHtml);
      }, 1000);
    },
  });

  // Fetch document details on load
  const loadDocument = useCallback(async () => {
    setIsLoadingDoc(true);
    setLoadError(null);

    try {
      const doc = await fetchDocumentById(documentId, currentUser.id);
      setDocument(doc);
      setTitle(doc.title);

      if (editor && !editor.isDestroyed) {
        isInitialLoadRef.current = true;
        editor.commands.setContent(doc.content || '<p></p>');
        setTimeout(() => {
          isInitialLoadRef.current = false;
        }, 100);
      }
    } catch (err: any) {
      setLoadError(err.message || 'Unable to load document.');
    } finally {
      setIsLoadingDoc(false);
    }
  }, [documentId, currentUser.id, editor]);

  useEffect(() => {
    loadDocument();
  }, [loadDocument]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Title change handler
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    setSaveStatus('unsaved');

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      if (editor) {
        performSave(newTitle, editor.getHTML());
      }
    }, 1000);
  };

  // Manual save trigger
  const handleManualSave = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (editor) {
      performSave(title, editor.getHTML());
    }
  };

  if (isLoadingDoc) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center bg-slate-100 p-6">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-3" />
        <p className="text-slate-600 font-medium">Loading document...</p>
      </div>
    );
  }

  if (loadError || !document) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center bg-slate-100 p-6">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 max-w-md w-full text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Access Denied / Error</h2>
          <p className="text-slate-600 text-sm mb-6">{loadError}</p>
          <button
            onClick={onBackToDashboard}
            className="w-full py-2.5 px-4 bg-blue-600 text-white font-semibold rounded-xl shadow-md hover:bg-blue-700 transition flex items-center justify-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </button>
        </div>
      </div>
    );
  }

  const isOwner = document.ownerId === currentUser.id;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-100 flex flex-col">
      {/* Editor Header Bar */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 sticky top-16 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Back button & Title Input */}
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <button
              onClick={onBackToDashboard}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition shrink-0"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={title}
                onChange={handleTitleChange}
                placeholder="Untitled document"
                className="w-full text-lg font-bold text-slate-900 border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white rounded-lg px-2 py-1 transition focus:outline-none truncate"
              />
              <div className="flex items-center space-x-3 px-2 mt-0.5 text-xs text-slate-500">
                <span className="flex items-center">
                  Owner: <strong className="ml-1 text-slate-700">{document.owner?.name}</strong>
                </span>
                <span>•</span>
                {isOwner ? (
                  <span className="text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded">
                    You own this document
                  </span>
                ) : (
                  <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                    Shared with you
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Autosave Status & Controls */}
          <div className="flex items-center space-x-3 shrink-0">
            {/* Save Status Indicator */}
            <div className="flex items-center text-xs font-medium px-3 py-1.5 rounded-lg border bg-slate-50 border-slate-200">
              {saveStatus === 'saving' && (
                <span className="flex items-center text-amber-700 font-medium">
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin text-amber-600" />
                  Saving...
                </span>
              )}
              {saveStatus === 'saved' && (
                <span className="flex items-center text-emerald-700 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                  Saved
                </span>
              )}
              {saveStatus === 'unsaved' && (
                <span className="flex items-center text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-amber-400 mr-2" />
                  Unsaved changes
                </span>
              )}
              {saveStatus === 'failed' && (
                <span className="flex items-center text-red-600 font-medium" title={saveErrorMessage || 'Save failed'}>
                  <AlertTriangle className="w-3.5 h-3.5 mr-1.5 text-red-600" />
                  Save failed
                </span>
              )}
            </div>

            {/* Manual Save Button */}
            <button
              onClick={handleManualSave}
              disabled={saveStatus === 'saving' || saveStatus === 'saved'}
              className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition disabled:opacity-50 flex items-center space-x-1"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save</span>
            </button>

            {/* Share Button */}
            {isOwner && (
              <button
                onClick={() => setIsShareModalOpen(true)}
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm shadow-blue-500/20 transition flex items-center space-x-1.5"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </button>
            )}
          </div>
        </div>

        {/* Toolbar */}
        {editor && (
          <div className="max-w-7xl mx-auto mt-3 pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1">
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition ${
                editor.isActive('bold') ? 'bg-blue-100 text-blue-800 font-bold' : ''
              }`}
              title="Bold"
            >
              <Bold className="w-4 h-4" />
            </button>

            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition ${
                editor.isActive('italic') ? 'bg-blue-100 text-blue-800 font-bold' : ''
              }`}
              title="Italic"
            >
              <Italic className="w-4 h-4" />
            </button>

            <button
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={`p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition ${
                editor.isActive('underline') ? 'bg-blue-100 text-blue-800 font-bold' : ''
              }`}
              title="Underline"
            >
              <UnderlineIcon className="w-4 h-4" />
            </button>

            <div className="h-5 w-px bg-slate-200 mx-1" />

            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={`p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition ${
                editor.isActive('heading', { level: 1 }) ? 'bg-blue-100 text-blue-800 font-bold' : ''
              }`}
              title="Heading 1"
            >
              <Heading1 className="w-4 h-4" />
            </button>

            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={`p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition ${
                editor.isActive('heading', { level: 2 }) ? 'bg-blue-100 text-blue-800 font-bold' : ''
              }`}
              title="Heading 2"
            >
              <Heading2 className="w-4 h-4" />
            </button>

            <div className="h-5 w-px bg-slate-200 mx-1" />

            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition ${
                editor.isActive('bulletList') ? 'bg-blue-100 text-blue-800 font-bold' : ''
              }`}
              title="Bullet List"
            >
              <List className="w-4 h-4" />
            </button>

            <button
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition ${
                editor.isActive('orderedList') ? 'bg-blue-100 text-blue-800 font-bold' : ''
              }`}
              title="Numbered List"
            >
              <ListOrdered className="w-4 h-4" />
            </button>

            <div className="h-5 w-px bg-slate-200 mx-1" />

            <button
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition disabled:opacity-30"
              title="Undo"
            >
              <Undo className="w-4 h-4" />
            </button>

            <button
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition disabled:opacity-30"
              title="Redo"
            >
              <Redo className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Editor Workspace Canvas */}
      <div className="flex-1 py-8 px-4 sm:px-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg border border-slate-200/80 min-h-[650px] transition-all">
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Share Modal */}
      {document && (
        <ShareModal
          document={document}
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          onShareSuccess={loadDocument}
        />
      )}
    </div>
  );
};

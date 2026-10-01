import React, { useState, useRef } from 'react';
import { X, UploadCloud, FileText, AlertCircle, Loader2, FileCheck } from 'lucide-react';
import { uploadDocument } from '../services/api';
import { useDemoUser } from '../context/DemoUserContext';
import { DocumentItem } from '../types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (newDoc: DocumentItem) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
}) => {
  const { currentUser } = useDemoUser();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const allowedExtensions = ['.txt', '.md', '.docx'];

  const validateFile = (file: File): boolean => {
    setError(null);
    const fileName = file.name.toLowerCase();
    const hasValidExt = allowedExtensions.some((ext) => fileName.endsWith(ext));

    if (!hasValidExt) {
      setError(`Unsupported file type: "${file.name}". Only .txt, .md, and .docx files are supported.`);
      return false;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(`File size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds maximum allowed limit of 5 MB.`);
      return false;
    }

    return true;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      } else {
        setSelectedFile(null);
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      } else {
        setSelectedFile(null);
      }
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);

    try {
      const newDoc = await uploadDocument(selectedFile, currentUser.id);
      onUploadSuccess(newDoc);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to upload document. Please check file format and try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Upload Document</h3>
              <p className="text-xs text-slate-500">Import file into editor</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-2 text-red-700 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Supported Types Badge List */}
          <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
            <span className="font-semibold">Supported File Formats:</span>
            <div className="flex space-x-1.5 font-mono text-[11px] font-bold">
              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded">.TXT</span>
              <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded">.MD</span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">.DOCX</span>
            </div>
          </div>

          {/* Dropzone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition ${
              selectedFile
                ? 'border-indigo-500 bg-indigo-50/30'
                : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".txt,.md,.docx"
              className="hidden"
            />

            {selectedFile ? (
              <div className="flex flex-col items-center">
                <FileCheck className="w-12 h-12 text-indigo-600 mb-2" />
                <p className="font-semibold text-slate-800 text-sm">{selectedFile.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
                <span className="mt-3 text-xs text-indigo-600 font-semibold underline">
                  Click or drag another file to replace
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <UploadCloud className="w-12 h-12 text-slate-400 mb-2" />
                <p className="font-medium text-slate-700 text-sm">
                  Click to select file or drag & drop here
                </p>
                <p className="text-xs text-slate-400 mt-1">Maximum file size: 5 MB</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-white font-medium text-sm transition"
          >
            Cancel
          </button>
          <button
            onClick={handleUploadSubmit}
            disabled={!selectedFile || isUploading}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm shadow-md shadow-indigo-500/20 transition disabled:opacity-50 flex items-center space-x-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Parsing & Uploading...</span>
              </>
            ) : (
              <span>Upload Document</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

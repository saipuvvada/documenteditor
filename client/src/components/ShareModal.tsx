import React, { useState } from 'react';
import { X, Share2, UserCheck, AlertCircle, Loader2 } from 'lucide-react';
import { DocumentItem, User } from '../types';
import { shareDocument } from '../services/api';
import { useDemoUser } from '../context/DemoUserContext';

interface ShareModalProps {
  document: DocumentItem;
  isOpen: boolean;
  onClose: () => void;
  onShareSuccess: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  document,
  isOpen,
  onClose,
  onShareSuccess,
}) => {
  const { currentUser, availableUsers } = useDemoUser();
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter out owner from share list
  const shareableUsers = availableUsers.filter((u) => u.id !== document.ownerId);

  // Check if a user is already shared
  const isAlreadyShared = (userId: string) => {
    return document.shares?.some((s) => s.userId === userId) || false;
  };

  const handleShare = async (targetUserId: string) => {
    setError(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      await shareDocument(document.id, currentUser.id, targetUserId);
      const targetUser = availableUsers.find((u) => u.id === targetUserId);
      setSuccessMsg(`Document successfully shared with ${targetUser?.name || 'user'}!`);
      onShareSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to share document. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Share Document</h3>
              <p className="text-xs text-slate-500 truncate max-w-xs">{document.title}</p>
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

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start space-x-2 text-emerald-700 text-sm">
              <UserCheck className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Current Owner */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Document Owner</p>
            <div className="flex items-center space-x-3 mt-1">
              <div className="w-7 h-7 rounded-full bg-slate-700 text-white font-bold text-xs flex items-center justify-center">
                {document.owner?.name?.charAt(0) || 'O'}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{document.owner?.name}</p>
                <p className="text-xs text-slate-500">{document.owner?.email}</p>
              </div>
            </div>
          </div>

          {/* Demo Users List */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Select Demo User to Grant Access
            </p>
            <div className="space-y-2">
              {shareableUsers.map((user) => {
                const shared = isAlreadyShared(user.id);
                return (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-slate-300 transition"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{user.name}</p>
                        <p className="text-xs text-slate-400">{user.email}</p>
                      </div>
                    </div>

                    {shared ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                        <UserCheck className="w-3.5 h-3.5 mr-1" />
                        Access Granted
                      </span>
                    ) : (
                      <button
                        onClick={() => handleShare(user.id)}
                        disabled={isSubmitting}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50 flex items-center space-x-1"
                      >
                        {isSubmitting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <span>Share</span>
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 font-medium text-sm transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

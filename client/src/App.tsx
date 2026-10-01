import React, { useState } from 'react';
import { DemoUserProvider } from './context/DemoUserContext';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { TipTapEditor } from './components/TipTapEditor';

export const AppContent: React.FC = () => {
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Header />
      <main className="flex-1">
        {activeDocumentId ? (
          <TipTapEditor
            documentId={activeDocumentId}
            onBackToDashboard={() => setActiveDocumentId(null)}
          />
        ) : (
          <Dashboard onOpenDocument={(docId) => setActiveDocumentId(docId)} />
        )}
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <DemoUserProvider>
      <AppContent />
    </DemoUserProvider>
  );
};

export default App;

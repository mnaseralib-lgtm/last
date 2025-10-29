import React, { useState, useCallback } from 'react';
import Scanner from './components/Scanner';
import Reports from './components/Reports';
import Header from './components/Header';
import { AppView } from './types';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.SCANNER);
  const [scanCount, setScanCount] = useState(0);

  const handleScanSuccess = useCallback(() => {
    setScanCount(prevCount => prevCount + 1);
  }, []);

  return (
    <div className="bg-gray-100 min-h-screen font-sans text-gray-800">
      <Header setView={setView} currentView={view} scanCount={scanCount} />
      <main className="p-4 sm:p-6 pb-28">
        {view === AppView.SCANNER && <Scanner onScanSuccess={handleScanSuccess} />}
        {view === AppView.REPORTS && <Reports />}
      </main>
    </div>
  );
};

export default App;
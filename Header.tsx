import React from 'react';
import { AppView } from '../types';
import { ReportIcon, ScanIcon } from './icons';

interface HeaderProps {
  setView: (view: AppView) => void;
  currentView: AppView;
  scanCount: number;
}

const Header: React.FC<HeaderProps> = ({ setView, currentView, scanCount }) => {
  return (
    <header className="bg-gray-800 text-white shadow-lg sticky top-0 z-10">
      <div className="container mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2 sm:gap-4">
          <h1 className="text-xl sm:text-2xl font-bold tracking-wide">نظام الحضور الذكي</h1>
          {currentView === AppView.SCANNER && (
            <div className="bg-green-500 text-white text-sm font-bold px-3 py-1 rounded-full">
              <span>العدد:</span>
              <span className="mr-1 font-mono">{scanCount}</span>
            </div>
          )}
        </div>
        <button
          onClick={() => setView(currentView === AppView.SCANNER ? AppView.REPORTS : AppView.SCANNER)}
          className="p-2 rounded-full hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white transition-colors duration-200"
          aria-label={currentView === AppView.SCANNER ? "عرض التقارير" : "العودة للماسح"}
        >
          {currentView === AppView.SCANNER ? (
            <ReportIcon className="w-6 h-6" />
          ) : (
            <ScanIcon className="w-6 h-6" />
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;
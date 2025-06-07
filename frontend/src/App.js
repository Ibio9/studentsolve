import React, { useState } from 'react';
import ChatTutor from './ChatTutor';
import EssayFeedback from './EssayFeedback';

export default function App() {
  const [activeView, setActiveView] = useState('marker');

  const renderView = () => {
    switch (activeView) {
      case 'marker':
        return <EssayFeedback />;
      case 'ai':
        return <ChatTutor />;
      default:
        return (
          <div className="text-white text-lg font-medium">
            Select a tool from the sidebar.
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-appbg text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 p-6 flex flex-col">
        <h1 className="text-2xl font-bold mb-8">Student Solve</h1>
        <nav className="space-y-4">
          <button
            onClick={() => setActiveView('notes')}
            className="w-full text-left px-4 py-2 rounded hover:bg-gray-700 bg-gray-700/30"
          >
            📝 Notes (coming soon)
          </button>
          <button
            onClick={() => setActiveView('marker')}
            className={`w-full text-left px-4 py-2 rounded hover:bg-gray-700 ${
              activeView === 'marker' ? 'bg-gray-700' : ''
            }`}
          >
            🎯 AI Marker
          </button>
          <button
            onClick={() => setActiveView('ai')}
            className={`w-full text-left px-4 py-2 rounded hover:bg-gray-700 ${
              activeView === 'ai' ? 'bg-gray-700' : ''
            }`}
          >
            🤖 AI Tutor
          </button>
          <button
            onClick={() => setActiveView('flashcards')}
            className="w-full text-left px-4 py-2 rounded hover:bg-gray-700 bg-gray-700/30"
          >
            📚 Flashcards (coming soon)
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">{renderView()}</main>
    </div>
  );
}

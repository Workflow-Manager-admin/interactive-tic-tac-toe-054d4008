import React, { useState, useEffect } from 'react';
import './App.css';
import AssistantPanel from './AssistantPanel';
import './AssistantPanel.css';
import TicTacToe from './TicTacToe';

// PUBLIC_INTERFACE
function App() {
  const [theme, setTheme] = useState('light');

  // Effect to apply theme to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const [assistantOpen, setAssistantOpen] = useState(false);

  return (
    <div className="App">
      <header className="App-header" style={{ minHeight: 'auto', background: 'var(--bg-secondary, #f8f9fa)' }}>
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
        <TicTacToe />
      </header>
      {/* Assistant Floating Action Button */}
      {!assistantOpen && (
        <button
          className="assistant-fab"
          aria-label="Open game assistant"
          title="Ask game assistant"
          onClick={() => setAssistantOpen(true)}
        >
          🤖
        </button>
      )}
      {/* Assistant Panel */}
      <AssistantPanel open={assistantOpen} onClose={() => setAssistantOpen(false)} />
    </div>
  );
}

export default App;

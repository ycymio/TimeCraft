import React, { useState } from 'react';

interface FolderSetupProps {
  onDone: (dirHandle: FileSystemDirectoryHandle) => void;
}

export const FolderSetup: React.FC<FolderSetupProps> = ({ onDone }) => {
  const [error, setError] = useState('');

  const handlePick = async () => {
    try {
      const dirHandle = await (window as any).showDirectoryPicker();
      const required = ['todos.csv', 'daily_ideas.csv', 'categories.json', 'activities.csv'];
      const missing: string[] = [];
      for (const name of required) {
        try {
          await dirHandle.getFileHandle(name);
        } catch {
          missing.push(name);
        }
      }
      if (missing.length === 0) {
        onDone(dirHandle);
      } else {
        setError(`Missing files: ${missing.join(', ')}`);
      }
    } catch {
      setError('Folder selection canceled or not supported');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Select your data folder</h2>
      <button onClick={handlePick}>Select Folder</button>
      {/* File System Access API used; no input element needed */}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};
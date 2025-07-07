import React, { useState } from 'react';
import { validateDirectoryFiles } from '../utils/fileUtils';

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
      
      // Check if required files exist
      for (const name of required) {
        try {
          await dirHandle.getFileHandle(name);
        } catch {
          missing.push(name);
        }
      }
      
      if (missing.length > 0) {
        setError(`Missing files: ${missing.join(', ')}`);
        return;
      }
      
      // Validate file formats
      const validation = await validateDirectoryFiles(dirHandle);
      if (!validation.valid) {
        setError(`File format errors:\n${validation.errors.join('\n')}`);
        return;
      }
      
      // All checks passed
      onDone(dirHandle);
    } catch {
      setError('Folder selection canceled or not supported');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Select your data folder</h2>
      <button onClick={handlePick}>Select Folder</button>
      {/* File System Access API used; no input element needed */}
      {error && (
        <div style={{ 
          color: 'red', 
          marginTop: '10px',
          padding: '10px',
          border: '1px solid red',
          borderRadius: '4px',
          backgroundColor: '#ffebee',
          whiteSpace: 'pre-line'
        }}>
          {error}
        </div>
      )}
    </div>
  );
};
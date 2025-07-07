import React, { useState } from 'react';
import { validateDirectoryFiles } from '../utils/fileUtils';
import '../App.css';

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
    <div style={{ 
      padding: '40px 20px', 
      textAlign: 'center',
      maxWidth: '600px',
      margin: '0 auto',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'center',
      paddingTop: '15vh'
    }}>
      <h1 className="site-title" style={{ marginBottom: '1em' }}>
        <span className="site-title-hours">Hours</span>
        <span className="site-title-and">&amp;</span>
        <span className="site-title-me">Me</span>
      </h1>
      <h2 style={{ 
        marginBottom: '1.2em', 
        color: '#213547',
        fontSize: '1.5em',
        fontWeight: 500 
      }}>
        Select your data folder
      </h2>
      <button 
        onClick={handlePick}
        style={{
          border: '1.5px solid #4F8EF7',
          borderRadius: '6px',
          padding: '0.8em 2em',
          background: '#4F8EF7',
          color: '#fff',
          cursor: 'pointer',
          fontSize: '1em',
          fontWeight: 500,
          marginBottom: '2em'
        }}
      >
        Select Folder
      </button>
      {/* File System Access API used; no input element needed */}
      {error && (
        <div style={{ 
          color: '#d32f2f', 
          marginTop: '0',
          padding: '1em 1.5em',
          border: '1.5px solid #ffcdd2',
          borderRadius: '8px',
          backgroundColor: '#ffebee',
          whiteSpace: 'pre-line',
          fontSize: '0.95em',
          lineHeight: 1.5,
          maxWidth: '500px',
          textAlign: 'left'
        }}>
          {error}
        </div>
      )}
    </div>
  );
};
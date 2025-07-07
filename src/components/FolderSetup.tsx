import React, { useState } from 'react';
import { validateDirectoryFiles } from '../utils/fileUtils';
import '../App.css';

interface FolderSetupProps {
  onDone: (dirHandle: FileSystemDirectoryHandle) => void;
}

export const FolderSetup: React.FC<FolderSetupProps> = ({ onDone }) => {
  const [error, setError] = useState('');

  // Check if File System Access API is supported
  const isFileSystemAccessSupported = (): boolean => {
    return 'showDirectoryPicker' in window && 
           typeof (window as any).showDirectoryPicker === 'function' &&
           window.isSecureContext;
  };

  const getCompatibilityError = (): string => {
    const isSecure = window.isSecureContext;
    const hasAPI = 'showDirectoryPicker' in window;
    
    if (!hasAPI) {
      return 'Your browser does not support the File System Access API. Please use Chrome 86+, Edge 86+, or Opera 72+.';
    }
    
    if (!isSecure) {
      return 'File System Access API requires HTTPS. Please access via HTTPS or use the HTTPS setup script.';
    }
    
    return 'File System Access API is not available in this context.';
  };

  const handlePick = async () => {
    try {
      setError('');
      
      // Check browser compatibility first
      if (!isFileSystemAccessSupported()) {
        const errorMsg = getCompatibilityError();
        setError(errorMsg);
        console.error('File System Access API not supported:', errorMsg);
        return;
      }

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
    } catch (error) {
      console.error('Folder selection error:', error);
      console.log('Error type:', typeof error);
      console.log('Error name:', error instanceof Error ? error.name : 'Unknown');
      console.log('Error message:', error instanceof Error ? error.message : String(error));
      
      // Check if it's a user cancellation or an actual error
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          setError('Folder selection was canceled');
        } else if (error.name === 'NotSupportedError') {
          setError(getCompatibilityError());
        } else if (error.name === 'SecurityError') {
          setError('Browser security policy prevented folder access. Please ensure you are using HTTPS.');
        } else if (error.message.includes('showDirectoryPicker is not a function')) {
          setError(getCompatibilityError());
        } else {
          setError(`Error: ${error.message}`);
        }
      } else {
        setError('Folder selection canceled or not supported');
      }
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
      
      {!isFileSystemAccessSupported() && (
        <div style={{
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '20px',
          fontSize: '14px',
          lineHeight: '1.5',
          textAlign: 'left',
          maxWidth: '500px'
        }}>
          <strong>⚠️ Browser Compatibility Issue</strong>
          <br />
          {getCompatibilityError()}
          <br /><br />
          <strong>Requirements:</strong>
          <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
            <li>Chrome 86+, Edge 86+, or Opera 72+</li>
            <li>HTTPS protocol (secure context)</li>
          </ul>
          <strong>Solution:</strong>
          <br />
          Run the HTTPS setup script: <code>./start-azure-https.sh</code>
        </div>
      )}
      
      <button 
        onClick={handlePick}
        disabled={!isFileSystemAccessSupported()}
        style={{
          border: `1.5px solid ${isFileSystemAccessSupported() ? '#4F8EF7' : '#ccc'}`,
          borderRadius: '6px',
          padding: '0.8em 2em',
          background: isFileSystemAccessSupported() ? '#4F8EF7' : '#f5f5f5',
          color: isFileSystemAccessSupported() ? '#fff' : '#999',
          cursor: isFileSystemAccessSupported() ? 'pointer' : 'not-allowed',
          fontSize: '1em',
          fontWeight: 500,
          marginBottom: '2em',
          transition: 'all 0.2s ease'
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
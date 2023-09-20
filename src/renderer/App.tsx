import DropArea from './DropArea';
import { useState } from 'react';
import './App.css';

export default function App() {
  const [droppedFilePath, setDroppedFilePath] = useState<string | null>(null);

  const handleFileDrop = (filePath: string) => {
    setDroppedFilePath(filePath);
  };

  return (
    <>
      <DropArea onFileDrop={handleFileDrop} />

      {droppedFilePath && (
        <div className="dropped-file-path">
          File path of the dropped CSV: {droppedFilePath}
        </div>
      )}
    </>
  );
}

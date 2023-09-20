import React, { useCallback, useEffect, useState } from 'react';
import { Box, Text } from '@chakra-ui/react';

interface DropAreaProps {
  onFileDrop: (filePath: string) => void;
}

const DropArea: React.FC<DropAreaProps> = ({ onFileDrop }) => {
  const [parsedData, setParsedData] = useState<string | null>(null);

  useEffect(() => {
    const handleParseCsvResponse = (
      event: Electron.IpcRendererEvent,
      response: string,
    ) => {
      setParsedData(response);
      console.log('>>>>>> response: ', response);
    };

    // Listen for the 'parse-csv' response
    window.electron.ipcRenderer.on('parse-csv', handleParseCsvResponse);

    // Cleanup the event listener when the component unmounts
    return () => {
      window.electron.ipcRenderer.removeListener(
        'parse-csv',
        handleParseCsvResponse,
      );
    };
  }, []);

  const downloadFormattedCSV = () => {
    if (parsedData) {
      // Create a Blob containing the formatted CSV data
      const blob = new Blob([parsedData], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);

      // Create a hidden anchor element to trigger the download
      const a = document.createElement('a');
      a.href = url;
      a.download = 'formatted.csv';

      // Trigger a click event on the anchor element to start the download
      a.click();

      // Release the URL object to free up resources
      URL.revokeObjectURL(url);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();

      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        const filePath = files[0].path;

        // Check if the dropped file is a CSV file
        if (filePath.toLowerCase().endsWith('.csv')) {
          onFileDrop(filePath);

          // Trigger an IPC message with the file path
          window.electron.ipcRenderer.send('parse-csv', filePath);
        }
      }
    },
    [onFileDrop],
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <Box
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      p={4}
      border="2px dashed #ccc"
      borderRadius="md"
      textAlign="center"
    >
      <Text>Drag &amp; Drop a CSV file here</Text>
    </Box>
  );
};

export default DropArea;

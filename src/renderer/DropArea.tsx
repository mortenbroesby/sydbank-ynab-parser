import React, { useCallback, useEffect, useState } from 'react';
import { Box, Text, Button, Stack, ButtonGroup } from '@chakra-ui/react';

interface DropAreaProps {}

const DropArea: React.FC<DropAreaProps> = ({}) => {
  const [droppedFilePath, setDroppedFilePath] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<string | null>(null);
  const [parsedFileName, setParsedFileName] = useState<string | null>(null);

  useEffect(() => {
    const handleParseCsvResponse = (
      event: Electron.IpcRendererEvent,
      responseData: string,
    ) => {
      const { data, fileName } = JSON.parse(responseData);
      setParsedData(data);
      setParsedFileName(fileName);
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
    if (!parsedData) return;

    // Create a Blob containing the formatted CSV data
    const blob = new Blob([parsedData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    // Create a hidden anchor element to trigger the download
    const a = document.createElement('a');
    a.href = url;
    a.download = parsedFileName ?? 'formatted.csv';

    // Trigger a click event on the anchor element to start the download
    a.click();

    // Release the URL object to free up resources
    URL.revokeObjectURL(url);
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();

    // Get the file path from the dropped file
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      const filePath = files[0].path;

      // Check if the dropped file is a CSV file
      if (filePath.toLowerCase().endsWith('.csv')) {
        // Trigger an IPC message with the file path
        setDroppedFilePath(filePath);
        window.electron.ipcRenderer.send('parse-csv', filePath);
      }
    }
  }, []);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleReset = () => {
    setParsedData(null);
    setParsedFileName(null);
  };

  return (
    <Box
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      position="fixed"
      top={0}
      left={0}
      width="100%"
      height="100%"
      display="flex"
      justifyContent="center"
      alignItems="center"
    >
      <Box
        p={6}
        border="2px dashed #ccc"
        borderRadius="md"
        textAlign="center"
        maxWidth={400}
      >
        {!parsedData && <Text>Drag &amp; Drop a CSV file here</Text>}

        {parsedData && (
          <Stack spacing={4}>
            <Text mb={4}>File path of the dropped CSV: {droppedFilePath}</Text>
            <Button colorScheme="whatsapp" onClick={downloadFormattedCSV}>
              Download Formatted CSV
            </Button>
            <Button onClick={handleReset}>Clear</Button>
          </Stack>
        )}
      </Box>
    </Box>
  );
};

export default DropArea;

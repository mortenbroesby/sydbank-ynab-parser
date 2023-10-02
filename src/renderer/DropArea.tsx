import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Box,
  Text,
  Button,
  Stack,
  Heading,
  Input,
  Flex,
  IconButton,
  InputGroup,
  InputRightElement,
} from '@chakra-ui/react';
import { FaFileUpload } from 'react-icons/fa';

interface DropAreaProps {}

const DropArea: React.FC<DropAreaProps> = ({}) => {
  const [droppedFilePath, setDroppedFilePath] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<string | null>(null);
  const [parsedFileName, setParsedFileName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const handleParseCsvResponse = (
      event: Electron.IpcRendererEvent,
      responseData: string,
    ) => {
      const { data, fileName, error } = JSON.parse(responseData);

      if (error) {
        console.error(error);
        setErrorMessage(error);
        return;
      }

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

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelection(files[0]);
    }
  };

  const handleFileSelection = (file: File | null) => {
    if (file === null) {
      setDroppedFilePath(null);
      setParsedData(null);
      setParsedFileName(null);
    } else {
      const filePath = file.path;

      // Check if the selected file is a CSV file
      if (filePath.toLowerCase().endsWith('.csv')) {
        // Trigger an IPC message with the file path
        setDroppedFilePath(filePath);
        window.electron.ipcRenderer.send('parse-csv', filePath);
      }
    }
  };

  const handleOnClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
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
      <Stack spacing={6}>
        <Box
          p={6}
          border="2px dashed #ccc"
          borderRadius="md"
          textAlign="center"
          background="whiteAlpha.50"
          onClick={handleOnClick}
          cursor="pointer"
        >
          <Stack spacing={4}>
            <Heading>Sydbank YNAB Parser</Heading>

            {!parsedData && (
              <Stack spacing={2}>
                <Text textAlign="center">
                  Drag &amp; drop a CSV file into this area
                </Text>
                <Flex alignItems="center" justifyContent="center">
                  <Text>
                    Or click <b>here</b> to select one
                  </Text>
                  <Box ml={2}>
                    <span>
                      <FaFileUpload />
                    </span>
                  </Box>
                </Flex>
              </Stack>
            )}

            {parsedData && (
              <Stack spacing={4}>
                <Text mb={4}>
                  File path of the dropped CSV: {droppedFilePath}
                </Text>
                <Button colorScheme="telegram" onClick={downloadFormattedCSV}>
                  Download Formatted CSV
                </Button>
              </Stack>
            )}
          </Stack>
        </Box>

        {errorMessage && (
          <Stack spacing={4} background="white" borderRadius="2xl" padding="4">
            <Text color="black" fontWeight="bold">
              Oops. An error happened while parsing the CSV file 😬
            </Text>

            <Text color="black">Message: {errorMessage}</Text>
          </Stack>
        )}

        {parsedData ? (
          <Button colorScheme="whiteAlpha" onClick={handleReset}>
            Clear
          </Button>
        ) : (
          <Input
            type="file"
            ref={fileInputRef}
            display="none"
            onChange={handleFileInputChange}
          />
        )}
      </Stack>
    </Box>
  );
};

export default DropArea;

import { ChakraProvider, CSSReset, Box } from '@chakra-ui/react';
import DropArea from './DropArea';
import { useState } from 'react';

import customTheme from './chakra-theme';

export default function App() {
  const [droppedFilePath, setDroppedFilePath] = useState<string | null>(null);

  const handleFileDrop = (filePath: string) => {
    setDroppedFilePath(filePath);
  };

  return (
    <ChakraProvider theme={customTheme}>
      <CSSReset />
      <Box p={4} textAlign="center">
        <DropArea />
      </Box>
    </ChakraProvider>
  );
}

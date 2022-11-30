import { ChakraProvider, CSSReset, Box } from '@chakra-ui/react';
import DropArea from './DropArea';

import customTheme from './chakra-theme';

export default function App() {
  return (
    <ChakraProvider theme={customTheme}>
      <CSSReset />
      <Box p={4} textAlign="center">
        <DropArea />
      </Box>
    </ChakraProvider>
  );
}

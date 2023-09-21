import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  styles: {
    global: {
      body: {
        position: 'relative',
        color: 'white',
        height: '100vh',
        background:
          'linear-gradient(200.96deg, #3674a7 -29.09%, #244564 129.35%)',
        fontFamily: 'sans-serif',
        overflowY: 'hidden',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.15)',
        },
      },
    },
  },
});

export default theme;

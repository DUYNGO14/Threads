import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { ChakraProvider, extendTheme, ColorModeScript } from '@chakra-ui/react';
import { mode } from '@chakra-ui/theme-tools';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import { RecoilRoot } from 'recoil';
import { SocketContextProvider } from '@context/SocketContext';
import { useEffect } from 'react';
import { setupInterceptors } from '@services/api.js';

const styles = {
  global: (props) => ({
    body: {
      color: mode('gray.800', 'whiteAlpha.900')(props),
      bg: mode('gray.100', '#101010')(props),
    },
  }),
};

const config = {
  initialColorMode: 'dark',
  useSystemColorMode: true,
};

const colors = {
  gray: {
    100: '#f7fafc',
    800: '#1a202c',
    light: '#616161',
    dark: '#1e1e1e',
  },
};


const theme = extendTheme({ styles, config, colors });

const InterceptorInit = () => {
  const navigate = useNavigate();
  useEffect(() => {
    setupInterceptors(navigate); // Gọi sớm nhất
  }, [navigate]);

  return null;
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RecoilRoot>
      <BrowserRouter>
        <ChakraProvider theme={theme}>
          <ColorModeScript initialColorMode={theme.config.initialColorMode} />
          <SocketContextProvider>
            <InterceptorInit />
            <App />
          </SocketContextProvider>
        </ChakraProvider>
      </BrowserRouter>
    </RecoilRoot>
  </StrictMode>
);

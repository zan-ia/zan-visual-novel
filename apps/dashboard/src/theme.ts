import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#7c4dff' },
    secondary: { main: '#00e5ff' },
    background: { default: '#0f0f23', paper: '#1a1a2e' },
    text: { primary: '#e8e8f0', secondary: '#a0a0b8' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontFamily: '"Playfair Display", serif' },
    h2: { fontFamily: '"Playfair Display", serif' },
    h3: { fontFamily: '"Playfair Display", serif' },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: { styleOverrides: { root: { textTransform: 'none', fontWeight: 600 } } },
  },
});

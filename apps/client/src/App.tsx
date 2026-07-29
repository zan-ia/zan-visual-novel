import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { theme } from './theme.js';
import { AuthProvider } from './providers/auth-provider.js';
import { LibraryPage } from './pages/library-page.js';
import { PlayerPage } from './pages/player-page.js';
import { ProfilePage } from './pages/profile-page.js';
import { LoginPage } from './pages/login-page.js';
import { CreditsShopPage } from './pages/credits-shop.js';
import { TransactionsPage } from './pages/transactions-page.js';
import { Layout } from './components/layout.js';

export function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<Layout />}>
              <Route path="/library" element={<LibraryPage />} />
              <Route path="/play/:vnId" element={<PlayerPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/credits" element={<CreditsShopPage />} />
              <Route path="/transactions" element={<TransactionsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/library" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

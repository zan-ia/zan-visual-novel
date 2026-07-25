import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { AuthProvider } from './providers/auth-provider.js';
import { StudioLayout } from './components/studio-layout.js';
import { VNListPage } from './pages/vn-list-page.js';
import { VNEditorPage } from './pages/vn-editor-page.js';
import { AnalyticsPage } from './pages/analytics-page.js';
import { LoginPage } from './pages/login-page.js';
import { theme } from './theme.js';

export function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<StudioLayout />}>
              <Route path="/studio" element={<VNListPage />} />
              <Route path="/studio/:vnId" element={<VNEditorPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/studio" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

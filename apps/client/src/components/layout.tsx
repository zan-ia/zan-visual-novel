import { Outlet, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Container, Box, Chip, Tooltip, Fade } from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import MemoryIcon from '@mui/icons-material/Memory';
import { useAuth } from '../providers/auth-provider.js';
import { useModel } from '../providers/model-provider.js';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

export function Layout() {
  const { user, isAuthenticated, logout } = useAuth();
  const { modelStatus, modelProgress, modelStatusText, modelDevice, modelError } = useModel();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <AppBar
        position="sticky"
        color="transparent"
        elevation={0}
        sx={{
          background: 'rgba(15, 15, 35, 0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <Toolbar>
          <Typography
            variant="h6"
            sx={{
              flexGrow: 1,
              fontFamily: '"Playfair Display", serif',
              cursor: 'pointer',
              color: location.pathname === '/library' ? 'primary.main' : 'inherit',
            }}
            onClick={() => navigate('/library')}
          >
            Zan VN
          </Typography>
          {isOffline && (
            <Chip
              icon={<WifiOffIcon />}
              label="Offline"
              size="small"
              color="warning"
              variant="outlined"
              sx={{ mr: 2 }}
            />
          )}
          {isAuthenticated ? (
            <>
              {/* Model loading indicator */}
              <Fade in={modelStatus !== 'ready'}>
                <Box>
                  {modelStatus === 'error' ? (
                    <Tooltip title={modelError || 'Erro ao carregar modelo'} arrow>
                      <Chip
                        icon={<MemoryIcon />}
                        label="IA offline"
                        size="small"
                        color="warning"
                        variant="outlined"
                        sx={{ mr: 1 }}
                      />
                    </Tooltip>
                  ) : modelStatus === 'fallback' ? (
                    <Tooltip title={`IA local: ${modelDevice.toUpperCase()}`} arrow>
                      <Chip
                        icon={<MemoryIcon />}
                        label="IA CPU"
                        size="small"
                        color="default"
                        variant="outlined"
                        sx={{ mr: 1 }}
                      />
                    </Tooltip>
                  ) : (
                    <Tooltip title={modelStatusText || 'Carregando modelo de IA...'} arrow>
                      <Chip
                        icon={<MemoryIcon />}
                        label={`IA ${Math.round(modelProgress)}%`}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ mr: 1 }}
                      />
                    </Tooltip>
                  )}
                </Box>
              </Fade>
              <Button
                color="inherit"
                size="small"
                onClick={() => navigate('/credits')}
                startIcon={<ShoppingCartIcon />}
                sx={{ mr: 1, textTransform: 'none' }}
              >
                🪙 {user?.creditsBalance ?? 0} créditos
              </Button>
              <Button
                color="inherit"
                onClick={() => navigate('/transactions')}
                size="small"
                sx={{ mr: 1 }}
              >
                Extrato
              </Button>
              <Button
                color={location.pathname.startsWith('/profile') ? 'primary' : 'inherit'}
                onClick={() => navigate('/profile')}
              >
                {user?.displayName}
              </Button>
              <Button color="inherit" onClick={logout} sx={{ ml: 1 }}>
                Sair
              </Button>
            </>
          ) : (
            <Button variant="outlined" color="inherit" onClick={() => navigate('/login')}>
              Entrar
            </Button>
          )}
        </Toolbar>
      </AppBar>
      <Container component="main" maxWidth="lg" sx={{ flex: 1, py: 4 }}>
        <Outlet />
      </Container>
    </Box>
  );
}

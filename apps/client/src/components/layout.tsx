import { Outlet } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Container, Box } from '@mui/material';
import { useAuth } from '../providers/auth-provider.js';
import { useNavigate } from 'react-router-dom';

export function Layout() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <AppBar
        position="sticky"
        color="transparent"
        elevation={0}
        sx={{ backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <Toolbar>
          <Typography
            variant="h6"
            sx={{ flexGrow: 1, fontFamily: '"Playfair Display", serif', cursor: 'pointer' }}
            onClick={() => navigate('/library')}
          >
            Zan VN
          </Typography>
          {isAuthenticated ? (
            <>
              <Button
                color="inherit"
                size="small"
                onClick={() => navigate('/credits')}
                sx={{ mr: 1, textTransform: 'none' }}
              >
                🪙 {user?.creditsBalance ?? 0} créditos
              </Button>
              <Button color="inherit" onClick={() => navigate('/transactions')} size="small" sx={{ mr: 1 }}>
                Extrato
              </Button>
              <Button color="inherit" onClick={() => navigate('/profile')}>
                {user?.displayName}
              </Button>
              <Button color="inherit" onClick={logout} sx={{ ml: 1 }}>
                Sair
              </Button>
            </>
          ) : (
            <Button color="inherit" onClick={() => navigate('/login')}>
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

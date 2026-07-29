import { Box, Typography, Paper, Button } from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { useAuth } from '../providers/auth-provider.js';
import { useNavigate } from 'react-router-dom';

export function ProfilePage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return (
      <Box textAlign="center" py={8}>
        <Paper sx={{ maxWidth: 400, mx: 'auto', p: 4, textAlign: 'center' }}>
          <Typography variant="h5" mb={2}>
            Faça login para ver seu perfil
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={4}>
            Acesse sua biblioteca, progresso e créditos
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<LoginIcon />}
            onClick={() => navigate('/login')}
            sx={{ mb: 1.5 }}
          >
            Entrar
          </Button>
          <Box>
            <Button variant="text" onClick={() => navigate('/login')}>
              Criar conta
            </Button>
          </Box>
        </Paper>
      </Box>
    );
  }

  return (
    <Box maxWidth="var(--content-sm)" mx="auto">
      <Typography variant="h3" mb={3}>
        Meu Perfil
      </Typography>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h6">{user?.displayName}</Typography>
        <Typography color="text.secondary" mb={2}>
          {user?.email}
        </Typography>
        <Typography variant="h4" color="primary" mb={3}>
          {user?.creditsBalance ?? 0} créditos
        </Typography>
        <Button
          variant="contained"
          startIcon={<ShoppingCartIcon />}
          title="Comprar créditos na loja"
        >
          Comprar Créditos
        </Button>
      </Paper>
    </Box>
  );
}

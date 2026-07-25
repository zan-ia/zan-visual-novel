import { Box, Typography, Paper, Button } from '@mui/material';
import { useAuth } from '../providers/auth-provider.js';

export function ProfilePage() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <Box textAlign="center" py={8}>
        <Typography variant="h5">Faça login para ver seu perfil</Typography>
      </Box>
    );
  }

  return (
    <Box maxWidth={600} mx="auto">
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
        <Button variant="contained">Comprar Créditos</Button>
      </Paper>
    </Box>
  );
}

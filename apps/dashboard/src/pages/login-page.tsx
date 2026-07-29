import { Box, Typography, TextField, Button, Paper } from '@mui/material';
import { useState } from 'react';
import { useAuth } from '../providers/auth-provider.js';
import { useNavigate } from 'react-router-dom';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/studio');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao autenticar');
    }
  };

  return (
    <Box
      sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' }}
    >
      <Paper sx={{ p: 4, maxWidth: 400, width: '100%' }}>
        <Typography variant="h4" mb={1} textAlign="center">
          Zan VN
        </Typography>
        <Typography variant="body2" mb={3} textAlign="center" color="text.secondary">
          Acesse seu painel de criação
        </Typography>
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Senha"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            required
          />
          {error && (
            <Typography color="error" variant="body2" mt={1}>
              {error}
            </Typography>
          )}
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 2, py: 1.5 }}>
            Entrar
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

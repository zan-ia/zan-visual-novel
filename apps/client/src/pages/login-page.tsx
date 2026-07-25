import { Box, Typography, TextField, Button, Paper } from '@mui/material';
import { useState } from 'react';
import { useAuth } from '../providers/auth-provider.js';
import { useNavigate } from 'react-router-dom';

export function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegister) {
        await register(email, password, displayName);
      } else {
        await login(email, password);
      }
      navigate('/library');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao autenticar');
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100dvh',
        p: 2,
      }}
    >
      <Paper sx={{ p: 4, maxWidth: 400, width: '100%' }}>
        <Typography variant="h4" sx={{ mb: 1, textAlign: 'center' }}>
          Zan Visual Novel
        </Typography>
        <Typography variant="body2" sx={{ mb: 3, textAlign: 'center', color: 'text.secondary' }}>
          {isRegister ? 'Crie sua conta' : 'Entre para continuar'}
        </Typography>

        <Box component="form" onSubmit={handleSubmit}>
          {isRegister && (
            <TextField
              fullWidth
              label="Nome"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              margin="normal"
              required
            />
          )}
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
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 2, py: 1.5 }}>
            {isRegister ? 'Criar Conta' : 'Entrar'}
          </Button>
        </Box>

        <Button fullWidth variant="text" onClick={() => setIsRegister(!isRegister)} sx={{ mt: 1 }}>
          {isRegister ? 'Já tem conta? Entrar' : 'Não tem conta? Criar'}
        </Button>
      </Paper>
    </Box>
  );
}

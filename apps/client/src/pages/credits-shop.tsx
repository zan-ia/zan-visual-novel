import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  CircularProgress,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import StarIcon from '@mui/icons-material/Star';
import { useState, useEffect } from 'react';
import { CREDIT_PACKAGES } from '@zan-vn/shared';
import { useAuth } from '../providers/auth-provider.js';

export function CreditsShopPage() {
  const { api, user } = useAuth();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [packages, setPackages] = useState(CREDIT_PACKAGES);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getCreditPackages()
      .then((res) => {
        if (res.success && Array.isArray(res.data)) setPackages(res.data as any);
      })
      .catch(() => {});
  }, []);

  const handleBuy = async (pkg: (typeof CREDIT_PACKAGES)[number]) => {
    setLoadingId(pkg.id);
    setError(null);
    try {
      const res = await api.checkout(pkg.id);
      if (res.success && (res.data as any)?.url) {
        window.location.href = (res.data as any).url;
      } else {
        setError(res.error?.message ?? 'Erro ao iniciar checkout');
      }
    } catch {
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Loja de Créditos
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={4}>
        Seu saldo atual: <strong>{user?.creditsBalance ?? 0} créditos</strong>
      </Typography>

      {error && (
        <Typography color="error" mb={2}>
          {error}
        </Typography>
      )}

      <Grid container spacing={3}>
        {packages.map((pkg) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={pkg.id}>
            <Card
              sx={{
                position: 'relative',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {pkg.id === 'large' && (
                <Chip
                  icon={<StarIcon />}
                  label="Mais Popular"
                  color="primary"
                  size="small"
                  sx={{ position: 'absolute', top: 12, right: 12 }}
                />
              )}
              <CardContent sx={{ flex: 1 }}>
                <Typography variant="h5" gutterBottom>
                  {pkg.name}
                </Typography>
                <Typography variant="h3" color="primary" gutterBottom>
                  {pkg.credits}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  créditos para desbloquear conteúdo premium
                </Typography>
                <Typography variant="h6" mt={2}>
                  {(pkg.priceCents / 100).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={
                    loadingId === pkg.id ? <CircularProgress size={16} /> : <ShoppingCartIcon />
                  }
                  onClick={() => handleBuy(pkg)}
                  disabled={loadingId !== null}
                >
                  {loadingId === pkg.id ? 'Redirecionando...' : 'Comprar'}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

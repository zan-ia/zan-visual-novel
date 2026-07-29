import { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Chip, CircularProgress, Alert } from '@mui/material';
import Grid from '@mui/material/Grid2';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

function getToken(): string | null {
  return localStorage.getItem('access_token');
}

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  priceCents: number;
}

interface CreditConfig {
  packages: CreditPackage[];
  creatorRevenueShare: number;
}

export function AdminCreditsConfigPage() {
  const [config, setConfig] = useState<CreditConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = getToken();
        const res = await fetch(`${API_URL}/api/v1/admin/credits/config`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error?.message ?? 'Erro na requisição');
        setConfig(json.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const formatPrice = (cents: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontFamily: '"Playfair Display", serif' }}>
        Configuração de Créditos
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : config ? (
        <>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Pacotes de Créditos
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {config.packages.map((pkg) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={pkg.id}>
                <Card
                  sx={{
                    bgcolor: 'background.paper',
                    border: '1px solid rgba(255,255,255,0.08)',
                    height: '100%',
                  }}
                >
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      {pkg.name}
                    </Typography>
                    <Typography variant="h5" color="primary" gutterBottom>
                      {formatPrice(pkg.priceCents)}
                    </Typography>
                    <Chip
                      label={`${pkg.credits} créditos`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Typography variant="h6" sx={{ mb: 2 }}>
            Repartição de Receita
          </Typography>
          <Card
            sx={{
              bgcolor: 'background.paper',
              border: '1px solid rgba(255,255,255,0.08)',
              maxWidth: 400,
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Criador
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {Math.round(config.creatorRevenueShare * 100)}%
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Plataforma
                  </Typography>
                  <Typography variant="h4" color="text.secondary">
                    {Math.round((1 - config.creatorRevenueShare) * 100)}%
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </>
      ) : null}
    </Box>
  );
}

import { Box, Typography, Button, Card, CardContent, CardActions, Chip, Skeleton, Alert } from '@mui/material';
import Grid from '@mui/material/Grid2';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import { useState, useEffect } from 'react';
import type { VisualNovel } from '@zan-vn/shared';
import { EmptyState } from '@zan-vn/ui';
import { useAuth } from '../providers/auth-provider.js';
import { useNavigate } from 'react-router-dom';

export function VNListPage() {
  const { api } = useAuth();
  const navigate = useNavigate();
  const [vns, setVNs] = useState<VisualNovel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.listVNs({ creator: 'me' }).then((res) => {
      if (res.success && res.data) {
        const response = res.data as any;
        setVNs(response.data ?? []);
      } else {
        setError(res.error?.message ?? 'Erro ao carregar VNs.');
      }
      setLoading(false);
    }).catch(() => {
      setError('Erro ao carregar VNs.');
      setLoading(false);
    });
  }, []);

  if (error) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h3">Minhas Visual Novels</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/studio/new')}>
          Nova VN
        </Button>
      </Box>

      {loading ? (
        <Grid container spacing={3} aria-busy="true" aria-label="Carregando VNs">
          {[0, 1, 2].map((i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
              <Skeleton
                variant="rounded"
                height={200}
                sx={{ bgcolor: 'rgba(124,77,255,0.08)' }}
              />
            </Grid>
          ))}
        </Grid>
      ) : vns.length === 0 ? (
        <EmptyState
          icon={<EditIcon style={{ width: 120, height: 120 }} />}
          title="Crie sua primeira visual novel"
          description="Comece a criar sua história com ferramentas poderosas de narrativa"
          action={{
            label: 'Nova VN',
            onClick: () => navigate('/studio/new'),
          }}
        />
      ) : (
        <Grid container spacing={3}>
          {vns.map((vn) => (
            <Grid key={vn.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card sx={{ cursor: 'pointer' }} onClick={() => navigate(`/studio/${vn.id}`)}>
                <CardContent>
                  <Typography variant="h6">{vn.title}</Typography>
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    {vn.totalChapters} capítulos
                  </Typography>
                  <Chip
                    label={vn.status === 'published' ? 'Publicado' : 'Rascunho'}
                    color={vn.status === 'published' ? 'success' : 'default'}
                    size="small"
                  />
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/studio/${vn.id}`);
                    }}
                  >
                    Editar
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}

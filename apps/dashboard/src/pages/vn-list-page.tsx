import { Box, Typography, Button, Card, CardContent, CardActions, Grid, Chip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useState, useEffect } from 'react';
import type { VisualNovel } from '@zan-vn/shared';
import { useAuth } from '../providers/auth-provider.js';
import { useNavigate } from 'react-router-dom';

export function VNListPage() {
  const { api } = useAuth();
  const navigate = useNavigate();
  const [vns, setVNs] = useState<VisualNovel[]>([]);

  useEffect(() => {
    api.listVNs({ creator: 'me' }).then((res) => {
      if (res.success && res.data) {
        const response = res.data as any;
        setVNs(response.data ?? []);
      }
    });
  }, []);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h3">Minhas Visual Novels</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/studio/new')}>
          Nova VN
        </Button>
      </Box>

      <Grid container spacing={3}>
        {vns.map((vn) => (
          <Box key={vn.id} sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 4' } }}>
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
          </Box>
        ))}
        {vns.length === 0 && (
          <Box sx={{ gridColumn: 'span 12' }}>
            <Typography color="text.secondary" textAlign="center">
              Você ainda não criou nenhuma visual novel. Clique em "Nova VN" para começar!
            </Typography>
          </Box>
        )}
      </Grid>
    </Box>
  );
}

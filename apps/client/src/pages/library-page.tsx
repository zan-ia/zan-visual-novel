import { Box, Typography, Grid, TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useState, useEffect } from 'react';
import { VNCard } from '@zan-vn/ui';
import type { VisualNovel } from '@zan-vn/shared';
import { useAuth } from '../providers/auth-provider.js';
import { useNavigate } from 'react-router-dom';

export function LibraryPage() {
  const { api } = useAuth();
  const navigate = useNavigate();
  const [vns, setVNs] = useState<VisualNovel[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listVNs().then((res) => {
      if (res.success && res.data) {
        setVNs((res.data as any).data ?? []);
      }
      setLoading(false);
    });
  }, []);

  const filtered = vns.filter(
    (vn) =>
      vn.title.toLowerCase().includes(search.toLowerCase()) ||
      vn.synopsis.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Box>
      <Typography variant="h3" sx={{ mb: 1 }}>
        Biblioteca
      </Typography>
      <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
        Descubra visual novels interativas com narrativa gerada por IA
      </Typography>

      <TextField
        fullWidth
        placeholder="Buscar visual novels..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 4 }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          },
        }}
      />

      {loading ? (
        <Typography color="text.secondary">Carregando...</Typography>
      ) : (
        <Grid container spacing={3}>
          {filtered.map((vn) => (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={vn.id}>
              <VNCard vn={vn} onClick={() => navigate(`/play/${vn.id}`)} />
            </Grid>
          ))}
          {filtered.length === 0 && (
            <Grid size={12}>
              <Typography color="text.secondary" textAlign="center">
                Nenhuma visual novel encontrada.
              </Typography>
            </Grid>
          )}
        </Grid>
      )}
    </Box>
  );
}

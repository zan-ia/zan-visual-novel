import { Box, Typography, Grid, TextField, InputAdornment, Snackbar } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useState, useEffect, useCallback } from 'react';
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
  const [emptyMessage, setEmptyMessage] = useState<string | null>(null);

  useEffect(() => {
    api.listVNs().then((res) => {
      if (res.success && res.data) {
        setVNs((res.data as any).data ?? []);
      }
      setLoading(false);
    });
  }, []);

  const handleCardClick = useCallback(
    (vn: VisualNovel) => {
      if (vn.totalChapters === 0) {
        setEmptyMessage('Esta visual novel ainda não tem capítulos publicados.');
        return;
      }
      navigate(`/play/${vn.id}`);
    },
    [navigate],
  );

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
            <Box
              key={vn.id}
              sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 4', lg: 'span 3' } }}
            >
              <VNCard vn={vn} empty={vn.totalChapters === 0} onClick={handleCardClick} />
            </Box>
          ))}
          {filtered.length === 0 && (
            <Box sx={{ gridColumn: 'span 12' }}>
              <Typography color="text.secondary" textAlign="center">
                Nenhuma visual novel encontrada.
              </Typography>
            </Box>
          )}
        </Grid>
      )}

      <Snackbar
        open={!!emptyMessage}
        autoHideDuration={4000}
        onClose={() => setEmptyMessage(null)}
        message={emptyMessage ?? ''}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}

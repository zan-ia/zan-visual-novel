import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Snackbar,
  Skeleton,
  Alert,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import SearchIcon from '@mui/icons-material/Search';
import BookIcon from '@mui/icons-material/MenuBook';
import { useState, useEffect, useCallback } from 'react';
import { VNCard, EmptyState } from '@zan-vn/ui';
import type { VisualNovel } from '@zan-vn/shared';
import { useAuth } from '../providers/auth-provider.js';
import { useNavigate } from 'react-router-dom';

export function LibraryPage() {
  const { api } = useAuth();
  const navigate = useNavigate();
  const [vns, setVNs] = useState<VisualNovel[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emptyMessage, setEmptyMessage] = useState<string | null>(null);

  useEffect(() => {
    api
      .listVNs()
      .then((res) => {
        if (res.success && res.data) {
          setVNs((res.data as any).data ?? []);
        } else {
          setError(res.error?.message ?? 'Erro ao carregar biblioteca.');
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Erro ao carregar biblioteca.');
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

  if (error) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

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
        <Grid container spacing={3} aria-busy="true" aria-label="Carregando biblioteca">
          {[0, 1, 2, 3].map((i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <Skeleton
                variant="rounded"
                height={280}
                sx={{ bgcolor: 'rgba(124,77,255,0.08)' }}
              />
            </Grid>
          ))}
        </Grid>
      ) : filtered.length === 0 ? (
        search ? (
          <EmptyState
            icon={<SearchIcon style={{ width: 120, height: 120 }} />}
            title="Nenhuma VN encontrada"
            description={`Nenhum resultado para "${search}". Tente outro termo.`}
            action={{
              label: 'Explorar biblioteca',
              onClick: () => setSearch(''),
              variant: 'link',
            }}
          />
        ) : (
          <EmptyState
            icon={<BookIcon style={{ width: 120, height: 120 }} />}
            title="Em breve"
            description="Novas histórias estão sendo preparadas..."
          />
        )
      ) : (
        <Grid container spacing={3}>
          {filtered.map((vn) => (
            <Grid key={vn.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <VNCard vn={vn} empty={vn.totalChapters === 0} onClick={handleCardClick} />
            </Grid>
          ))}
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

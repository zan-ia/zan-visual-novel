import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
} from '@mui/material';
import type { VisualNovel, VNStatus } from '@zan-vn/shared';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

function getToken(): string | null {
  return localStorage.getItem('access_token');
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}/api/v1${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message ?? 'Erro na requisição');
  return json;
}

const STATUS_COLORS: Record<
  VNStatus,
  'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'
> = {
  draft: 'default',
  published: 'success',
  archived: 'warning',
  under_review: 'info',
};

const STATUS_LABELS: Record<VNStatus, string> = {
  draft: 'Rascunho',
  published: 'Publicado',
  archived: 'Arquivado',
  under_review: 'Em Revisão',
};

export function AdminModerationPage() {
  const [vns, setVNs] = useState<VisualNovel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVNs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ success: boolean; data: VisualNovel[] }>('/admin/vns');
      setVNs(res.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVNs();
  }, [fetchVNs]);

  const handleStatusChange = async (vnId: string, newStatus: string) => {
    try {
      await apiFetch(`/admin/vns/${vnId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      setVNs((prev) =>
        prev.map((v) => (v.id === vnId ? { ...v, status: newStatus as VNStatus } : v)),
      );
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontFamily: '"Playfair Display", serif' }}>
        Moderação de VNs
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
      ) : (
        <TableContainer
          component={Paper}
          sx={{ bgcolor: 'background.paper', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Título</TableCell>
                <TableCell>Criador</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Preço</TableCell>
                <TableCell align="center">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {vns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    Nenhuma VN encontrada
                  </TableCell>
                </TableRow>
              ) : (
                vns.map((vn) => (
                  <TableRow key={vn.id}>
                    <TableCell>{vn.title}</TableCell>
                    <TableCell>{vn.creatorId}</TableCell>
                    <TableCell>
                      <Chip
                        label={STATUS_LABELS[vn.status] ?? vn.status}
                        color={STATUS_COLORS[vn.status] ?? 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{vn.priceCredits} créditos</TableCell>
                    <TableCell align="center">
                      <Select
                        size="small"
                        value={vn.status}
                        onChange={(e) => handleStatusChange(vn.id, e.target.value)}
                        sx={{ minWidth: 140 }}
                      >
                        <MenuItem value="published">Publicar</MenuItem>
                        <MenuItem value="under_review">Em Revisão</MenuItem>
                        <MenuItem value="archived">Arquivar</MenuItem>
                        <MenuItem value="draft" disabled>
                          Rascunho
                        </MenuItem>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}

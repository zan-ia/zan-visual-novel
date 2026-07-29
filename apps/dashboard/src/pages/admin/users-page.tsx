import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
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
  IconButton,
  Button,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import BlockIcon from '@mui/icons-material/Block';
import type { User, UserRole } from '@zan-vn/shared';

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

export function AdminUsersPage() {
  const [users, setUsers] = useState<(User & { deletedAt?: string | null })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [banTarget, setBanTarget] = useState<User | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (roleFilter !== 'all') params.set('role', roleFilter);
      if (search) params.set('search', search);
      const qs = params.toString();
      const res = await apiFetch<{ success: boolean; data: User[] }>(
        `/admin/users${qs ? `?${qs}` : ''}`,
      );
      setUsers(res.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [roleFilter, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await apiFetch(`/admin/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole }),
      });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole as UserRole } : u)),
      );
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleBan = async () => {
    if (!banTarget) return;
    try {
      await apiFetch(`/admin/users/${banTarget.id}/ban`, { method: 'POST' });
      setUsers((prev) =>
        prev.map((u) =>
          u.id === banTarget.id ? { ...u, deletedAt: new Date().toISOString() } : u,
        ),
      );
      setBanDialogOpen(false);
      setBanTarget(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontFamily: '"Playfair Display", serif' }}>
        Gerenciar Usuários
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          label="Buscar por nome ou email"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 280 }}
        />
        <Button variant="outlined" onClick={fetchUsers}>
          Buscar
        </Button>
      </Box>

      <Tabs
        value={roleFilter}
        onChange={(_e, val) => setRoleFilter(val)}
        sx={{ mb: 2 }}
        textColor="inherit"
      >
        <Tab label="Todos" value="all" />
        <Tab label="Jogadores" value="player" />
        <Tab label="Criadores" value="creator" />
        <Tab label="Admins" value="admin" />
      </Tabs>

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
                <TableCell>Nome</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Créditos</TableCell>
                <TableCell align="center">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    Nenhum usuário encontrado
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => (
                  <TableRow key={u.id} sx={{ opacity: u.deletedAt ? 0.4 : 1 }}>
                    <TableCell>{u.displayName}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <Select
                        size="small"
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        disabled={!!u.deletedAt}
                        sx={{ minWidth: 120 }}
                      >
                        <MenuItem value="player">Jogador</MenuItem>
                        <MenuItem value="creator">Criador</MenuItem>
                        <MenuItem value="admin">Admin</MenuItem>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${u.creditsBalance} créditos`}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        color="error"
                        size="small"
                        disabled={!!u.deletedAt}
                        onClick={() => {
                          setBanTarget(u);
                          setBanDialogOpen(true);
                        }}
                        title="Banir usuário"
                      >
                        <BlockIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={banDialogOpen} onClose={() => setBanDialogOpen(false)}>
        <DialogTitle>Confirmar Banimento</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja banir o usuário <strong>{banTarget?.displayName}</strong> (
            {banTarget?.email})? Esta ação é reversível apenas pelo banco de dados.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBanDialogOpen(false)}>Cancelar</Button>
          <Button color="error" variant="contained" onClick={handleBan}>
            Banir
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

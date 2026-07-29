import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Alert,
  Skeleton,
  Chip,
  List,
  ListItem,
  ListItemText,
  Stack,
  Divider,
} from '@mui/material';
import {
  Visibility as ViewsIcon,
  AttachMoney as EarningsIcon,
  MenuBook as VNsIcon,
  People as PlayersIcon,
} from '@mui/icons-material';
import { useAuth } from '../providers/auth-provider';

// ── Types ────────────────────────────────────────────────

interface AnalyticsSummary {
  totalViews: number;
  totalEarnings: number;
  totalVNs: number;
  uniquePlayers: number;
  recentEarnings: number;
}

interface VNMetric {
  id: string;
  title: string;
  views: number;
  earnings: number;
  status: string;
}

interface EarningEntry {
  id: string;
  amount: number;
  status: string;
  earnedAt: string;
}

type SortField = 'title' | 'views' | 'earnings' | 'status';
type SortDirection = 'asc' | 'desc';

// ── Helpers ──────────────────────────────────────────────

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR');
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

async function fetchAnalytics<T>(path: string): Promise<T> {
  const token = localStorage.getItem('access_token');
  const res = await fetch(`${API_URL}/api/v1/analytics${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message ?? 'Unknown error');
  return json.data as T;
}

// ── Summary Card ─────────────────────────────────────────

function SummaryCard({
  icon,
  label,
  value,
  loading,
  format = 'number',
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  loading: boolean;
  format?: 'currency' | 'number';
}) {
  return (
    <Paper sx={{ p: 3, flex: 1, minWidth: 180 }}>
      <Stack direction="row" alignItems="center" spacing={1} mb={1}>
        <Box sx={{ color: 'primary.main' }}>{icon}</Box>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
      </Stack>
      {loading ? (
        <Skeleton variant="text" width={120} height={48} />
      ) : (
        <Typography variant="h4" fontWeight={700}>
          {format === 'currency' ? formatCurrency(value) : value.toLocaleString('pt-BR')}
        </Typography>
      )}
    </Paper>
  );
}

// ── Page ─────────────────────────────────────────────────

export function AnalyticsPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [vns, setVNs] = useState<VNMetric[]>([]);
  const [earnings, setEarnings] = useState<EarningEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('views');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [summaryData, vnsData, earningsData] = await Promise.all([
        fetchAnalytics<AnalyticsSummary>('/creator/summary'),
        fetchAnalytics<VNMetric[]>('/creator/vns'),
        fetchAnalytics<EarningEntry[]>('/creator/earnings'),
      ]);
      setSummary(summaryData);
      setVNs(vnsData);
      setEarnings(earningsData);
    } catch (err: any) {
      setError(err.message ?? 'Erro ao carregar analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) loadData();
  }, [user, loadData]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const sortedVNs = useMemo(() => {
    const sorted = [...vns];
    sorted.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return sortDir === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
    return sorted;
  }, [vns, sortField, sortDir]);

  const statusLabel: Record<string, string> = {
    draft: 'Rascunho',
    published: 'Publicado',
    archived: 'Arquivado',
    under_review: 'Em revisão',
  };

  if (error) {
    return (
      <Box>
        <Typography variant="h3" mb={4}>
          Analytics
        </Typography>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h3" mb={4}>
        Analytics
      </Typography>

      {/* ── Summary Cards ────────────────────────────── */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={4}>
        <SummaryCard
          icon={<ViewsIcon />}
          label="Total de Visualizações"
          value={summary?.totalViews ?? 0}
          loading={loading}
        />
        <SummaryCard
          icon={<EarningsIcon />}
          label="Ganhos Totais"
          value={summary?.totalEarnings ?? 0}
          loading={loading}
          format="currency"
        />
        <SummaryCard
          icon={<VNsIcon />}
          label="Visual Novels"
          value={summary?.totalVNs ?? 0}
          loading={loading}
        />
        <SummaryCard
          icon={<PlayersIcon />}
          label="Jogadores Únicos"
          value={summary?.uniquePlayers ?? 0}
          loading={loading}
        />
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
        {/* ── VN Table ──────────────────────────────── */}
        <Box flex={2}>
          <Typography variant="h5" mb={2}>
            Suas Visual Novels
          </Typography>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>
                    <TableSortLabel
                      active={sortField === 'title'}
                      direction={sortField === 'title' ? sortDir : 'asc'}
                      onClick={() => handleSort('title')}
                    >
                      Título
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={sortField === 'views'}
                      direction={sortField === 'views' ? sortDir : 'asc'}
                      onClick={() => handleSort('views')}
                    >
                      Views
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={sortField === 'earnings'}
                      direction={sortField === 'earnings' ? sortDir : 'asc'}
                      onClick={() => handleSort('earnings')}
                    >
                      Ganhos
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={sortField === 'status'}
                      direction={sortField === 'status' ? sortDir : 'asc'}
                      onClick={() => handleSort('status')}
                    >
                      Status
                    </TableSortLabel>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={4}>
                        <Skeleton />
                      </TableCell>
                    </TableRow>
                  ))
                ) : sortedVNs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <Typography variant="body2" color="text.secondary" py={4}>
                        Nenhuma visual novel encontrada
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedVNs.map((vn) => (
                    <TableRow key={vn.id} hover>
                      <TableCell>{vn.title}</TableCell>
                      <TableCell align="right">{vn.views.toLocaleString('pt-BR')}</TableCell>
                      <TableCell align="right">{formatCurrency(vn.earnings)}</TableCell>
                      <TableCell align="right">
                        <Chip
                          label={statusLabel[vn.status] ?? vn.status}
                          size="small"
                          color={
                            vn.status === 'published'
                              ? 'success'
                              : vn.status === 'draft'
                                ? 'default'
                                : 'warning'
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* ── Recent Earnings ───────────────────────── */}
        <Box flex={1}>
          <Typography variant="h5" mb={2}>
            Ganhos Recentes
          </Typography>
          <Paper sx={{ p: 2 }}>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Box key={i} mb={1}>
                  <Skeleton />
                </Box>
              ))
            ) : earnings.length === 0 ? (
              <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
                Nenhum ganho registrado
              </Typography>
            ) : (
              <List disablePadding>
                {earnings.slice(0, 10).map((e, i) => (
                  <Box key={e.id}>
                    {i > 0 && <Divider component="li" />}
                    <ListItem disablePadding sx={{ py: 1.5 }}>
                      <ListItemText
                        primary={formatCurrency(e.amount)}
                        secondary={formatDate(e.earnedAt)}
                        primaryTypographyProps={{ fontWeight: 600, fontSize: '0.95rem' }}
                      />
                      <Chip
                        label={
                          e.status === 'available'
                            ? 'Disponível'
                            : e.status === 'pending'
                              ? 'Pendente'
                              : 'Retirado'
                        }
                        size="small"
                        color={
                          e.status === 'available'
                            ? 'success'
                            : e.status === 'pending'
                              ? 'warning'
                              : 'default'
                        }
                      />
                    </ListItem>
                  </Box>
                ))}
              </List>
            )}
          </Paper>
        </Box>
      </Stack>
    </Box>
  );
}

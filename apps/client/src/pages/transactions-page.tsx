import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from '@mui/material';
import { useState, useEffect } from 'react';
import { useAuth } from '../providers/auth-provider.js';

const TYPE_LABELS: Record<string, string> = {
  purchase: 'Compra',
  spend: 'Gasto',
  refund: 'Reembolso',
};

const TYPE_COLORS: Record<string, 'success' | 'error' | 'info'> = {
  purchase: 'success',
  spend: 'error',
  refund: 'info',
};

export function TransactionsPage() {
  const { api } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getTransactions()
      .then((res) => {
        if (res.success && Array.isArray(res.data)) setTransactions(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Extrato de Transações
      </Typography>

      {loading ? (
        <Typography color="text.secondary">Carregando...</Typography>
      ) : transactions.length === 0 ? (
        <Typography color="text.secondary">Nenhuma transação ainda.</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Data</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Descrição</TableCell>
                <TableCell align="right">Valor</TableCell>
                <TableCell align="right">Saldo</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.map((tx: any) => (
                <TableRow key={tx.id}>
                  <TableCell>{new Date(tx.createdAt).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>
                    <Chip
                      label={TYPE_LABELS[tx.type] ?? tx.type}
                      size="small"
                      color={TYPE_COLORS[tx.type] ?? 'default'}
                    />
                  </TableCell>
                  <TableCell>{tx.description ?? '-'}</TableCell>
                  <TableCell align="right">
                    {tx.type === 'spend' ? '-' : '+'}
                    {tx.amount} créditos
                  </TableCell>
                  <TableCell align="right">{tx.balanceAfter} créditos</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}

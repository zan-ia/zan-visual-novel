import { Box, Typography, Paper } from '@mui/material';

export function AnalyticsPage() {
  return (
    <Box>
      <Typography variant="h3" mb={4}>Analytics</Typography>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h6" mb={2}>Resumo</Typography>
        <Typography color="text.secondary">
          Métricas de consumo e créditos serão exibidas aqui.
        </Typography>
      </Paper>
    </Box>
  );
}

import { Box, Typography } from '@mui/material';
import BarChartIcon from '@mui/icons-material/BarChart';
import { EmptyState } from '@zan-vn/ui';

export function AnalyticsPage() {
  return (
    <Box>
      <Typography variant="h3" mb={4}>
        Analytics
      </Typography>
      <EmptyState
        icon={<BarChartIcon style={{ width: 120, height: 120 }} />}
        title="Analytics em breve"
        description="Acompanhe visualizações, engajamento e ganhos das suas visual novels em um só lugar"
      />
    </Box>
  );
}

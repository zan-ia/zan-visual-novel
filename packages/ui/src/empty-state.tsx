import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

export interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'button' | 'link';
  };
}

/**
 * EmptyState component — displays a centered message with icon,
 * title, optional description, and optional action button/link.
 * Uses MUI theme tokens for consistent styling.
 */
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Box
      role="status"
      aria-live="polite"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        py: 6,
        px: 3,
        textAlign: 'center',
      }}
    >
      <Box
        sx={{
          width: 120,
          height: 120,
          color: 'primary.main',
          opacity: 0.6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </Box>
      <Typography variant="h5" fontWeight={600}>
        {title}
      </Typography>
      {description && (
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400 }}>
          {description}
        </Typography>
      )}
      {action &&
        (action.variant === 'link' ? (
          <Button
            variant="text"
            onClick={action.onClick}
            sx={{ textTransform: 'none', fontWeight: 500 }}
          >
            {action.label}
          </Button>
        ) : (
          <Button variant="contained" onClick={action.onClick}>
            {action.label}
          </Button>
        ))}
    </Box>
  );
}

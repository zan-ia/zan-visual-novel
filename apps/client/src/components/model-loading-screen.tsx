import { Box, Typography, LinearProgress, Button, Fade } from '@mui/material';
import MemoryIcon from '@mui/icons-material/Memory';
import CloudIcon from '@mui/icons-material/Cloud';
import RefreshIcon from '@mui/icons-material/Refresh';

export type ModelStatus = 'detecting' | 'downloading' | 'loading' | 'ready' | 'error' | 'fallback';

export interface ModelLoadingScreenProps {
  status: ModelStatus;
  /** Download/load progress 0–100 */
  progress?: number;
  /** Human-readable status message */
  statusText?: string;
  /** Device label (e.g. 'webgpu', 'wasm') */
  device?: string;
  /** Error message when status === 'error' */
  error?: string;
  /** Called when user clicks "Tentar novamente" */
  onRetry?: () => void;
  /** Called when user clicks "Usar nuvem" */
  onUseCloud?: () => void;
  /** Called after fade-out animation completes (status === 'ready') */
  onReadyComplete?: () => void;
}

const STATUS_LABELS: Record<ModelStatus, string> = {
  detecting: 'Detectando capacidades do dispositivo...',
  downloading: 'Baixando modelo',
  loading: 'Carregando modelo na memória...',
  ready: 'Modelo pronto',
  error: 'Erro ao carregar modelo',
  fallback: 'Usando CPU — mais lento, mas funcional',
};

export function ModelLoadingScreen({
  status,
  progress = 0,
  statusText,
  device,
  error,
  onRetry,
  onUseCloud,
  onReadyComplete,
}: ModelLoadingScreenProps) {
  const displayStatus = statusText ?? STATUS_LABELS[status];

  return (
    <Fade in={status !== 'ready'} timeout={600} onExited={onReadyComplete}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60dvh',
          gap: 3,
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 3,
          background: 'linear-gradient(170deg, #0f0f23 0%, #1a1a2e 50%, #0f0f23 100%)',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse at 50% 40%, rgba(124,77,255,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          },
          // Floating particles
          '&::after': {
            content: '""',
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'radial-gradient(2px 2px at 20% 30%, rgba(124,77,255,0.3), transparent),' +
              'radial-gradient(2px 2px at 40% 70%, rgba(0,229,255,0.2), transparent),' +
              'radial-gradient(1px 1px at 60% 20%, rgba(124,77,255,0.4), transparent),' +
              'radial-gradient(2px 2px at 80% 60%, rgba(0,229,255,0.15), transparent),' +
              'radial-gradient(1px 1px at 10% 80%, rgba(124,77,255,0.25), transparent),' +
              'radial-gradient(2px 2px at 70% 40%, rgba(124,77,255,0.2), transparent),' +
              'radial-gradient(1px 1px at 90% 10%, rgba(0,229,255,0.3), transparent)',
            backgroundSize: '200px 200px',
            animation: 'particleDrift 20s linear infinite',
            pointerEvents: 'none',
            opacity: 0.6,
          },
        }}
      >
        {/* Logo */}
        <Typography
          variant="h3"
          sx={{
            fontFamily: '"Playfair Display", serif',
            color: 'primary.main',
            position: 'relative',
            zIndex: 1,
            '@keyframes logoGlow': {
              '0%, 100%': { textShadow: '0 0 20px rgba(124,77,255,0.3), 0 0 40px rgba(124,77,255,0.1)' },
              '50%': { textShadow: '0 0 30px rgba(124,77,255,0.5), 0 0 60px rgba(124,77,255,0.2)' },
            },
            animation: 'logoGlow 3s ease-in-out infinite',
          }}
        >
          Zan VN
        </Typography>

        {/* Icon */}
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          {status === 'error' ? (
            <MemoryIcon sx={{ fontSize: 48, color: 'error.main', opacity: 0.7 }} />
          ) : (
            <MemoryIcon
              sx={{
                fontSize: 48,
                color: status === 'ready' ? 'success.main' : 'primary.main',
                opacity: status === 'downloading' || status === 'loading' ? 1 : 0.6,
                ...(status === 'downloading' || status === 'loading'
                  ? {
                      '@keyframes iconPulse': {
                        '0%, 100%': { opacity: 0.5, transform: 'scale(1)' },
                        '50%': { opacity: 1, transform: 'scale(1.1)' },
                      },
                      animation: 'iconPulse 2s ease-in-out infinite',
                    }
                  : {}),
              }}
            />
          )}
        </Box>

        {/* Status text */}
        <Typography
          variant="body1"
          sx={{
            color: status === 'error' ? 'error.light' : 'text.secondary',
            textAlign: 'center',
            maxWidth: 400,
            position: 'relative',
            zIndex: 1,
          }}
        >
          {displayStatus}
        </Typography>

        {/* Progress bar */}
        {(status === 'downloading' || status === 'loading') && (
          <Box sx={{ width: '100%', maxWidth: 360, position: 'relative', zIndex: 1 }}>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: 'rgba(124,77,255,0.12)',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 3,
                  background: 'linear-gradient(90deg, #7c4dff, #00e5ff)',
                },
              }}
            />
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', display: 'block', textAlign: 'center', mt: 1 }}
            >
              {Math.round(progress)}%
            </Typography>
          </Box>
        )}

        {/* Device label */}
        {device && status !== 'error' && (
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              bgcolor: 'rgba(124,77,255,0.1)',
              px: 1.5,
              py: 0.5,
              borderRadius: 1,
              position: 'relative',
              zIndex: 1,
            }}
          >
            {device.toUpperCase()}
          </Typography>
        )}

        {/* Error actions */}
        {status === 'error' && error && (
          <Typography
            variant="caption"
            sx={{
              color: 'error.light',
              textAlign: 'center',
              maxWidth: 400,
              position: 'relative',
              zIndex: 1,
            }}
          >
            ⚠️ {error}
          </Typography>
        )}

        {status === 'error' && (
          <Box sx={{ display: 'flex', gap: 1.5, position: 'relative', zIndex: 1 }}>
            {onRetry && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<RefreshIcon />}
                onClick={onRetry}
              >
                Tentar novamente
              </Button>
            )}
            {onUseCloud && (
              <Button
                variant="contained"
                size="small"
                startIcon={<CloudIcon />}
                onClick={onUseCloud}
              >
                Usar nuvem
              </Button>
            )}
          </Box>
        )}

        {/* Fallback notice */}
        {status === 'fallback' && (
          <Typography
            variant="caption"
            sx={{
              color: 'warning.light',
              textAlign: 'center',
              maxWidth: 400,
              position: 'relative',
              zIndex: 1,
            }}
          >
            ⚡ WebGPU indisponível — usando CPU. O desempenho será menor.
          </Typography>
        )}
      </Box>
    </Fade>
  );
}

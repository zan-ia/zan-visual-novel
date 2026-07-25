import { Box, Typography, Button, CircularProgress } from '@mui/material';
import { useParams } from 'react-router-dom';
import { useVNEngine } from '@zan-vn/lib';
import { SceneRenderer, ChoicePanel } from '@zan-vn/ui';
import { useEffect } from 'react';
import { useAuth } from '../providers/auth-provider.js';

export function PlayerPage() {
  const { vnId } = useParams<{ vnId: string }>();
  const { api } = useAuth();
  const {
    currentScene,
    availableChoices,
    isLLMScene,
    isLoading,
    startGame,
    continueGame,
    makeChoice,
    setLLMProvider,
  } = useVNEngine();

  useEffect(() => {
    if (!vnId) return;
    api.getVN(vnId).then((res) => {
      if (res.success && res.data) {
        startGame(res.data as any);
      }
    });
  }, [vnId]);

  if (!currentScene) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60dvh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      {/* Scene content */}
      <SceneRenderer scene={currentScene} isLLMGenerated={isLLMScene} />

      {/* Choices or Continue button */}
      <Box sx={{ mt: 4 }}>
        {availableChoices.length > 0 ? (
          <ChoicePanel choices={availableChoices} onSelect={makeChoice} disabled={isLoading} />
        ) : (
          <Button
            variant="contained"
            onClick={continueGame}
            disabled={isLoading}
            fullWidth
            sx={{ py: 1.5, fontSize: '1.1rem' }}
          >
            {isLoading ? <CircularProgress size={24} /> : 'Continuar'}
          </Button>
        )}
      </Box>
    </Box>
  );
}

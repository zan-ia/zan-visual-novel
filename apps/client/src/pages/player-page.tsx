import {
  Box, Typography, Button, CircularProgress, IconButton, Drawer, List, ListItemButton,
  ListItemText, Chip, Alert, Snackbar,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import { useParams, useNavigate } from 'react-router-dom';
import { useVNEngine } from '@zan-vn/lib';
import { SceneRenderer, ChoicePanel } from '@zan-vn/ui';
import { useState, useEffect, useCallback, useRef } from 'react';
import type { SaveData } from '@zan-vn/shared';
import { useAuth } from '../providers/auth-provider.js';

export function PlayerPage() {
  const { vnId } = useParams<{ vnId: string }>();
  const { api } = useAuth();
  const navigate = useNavigate();
  const {
    currentScene, availableChoices, isLLMScene, isLoading,
    startGame, continueGame, makeChoice, createSave, setLLMProvider,
  } = useVNEngine();

  const [storyTitle, setStoryTitle] = useState('');
  const [saves, setSaves] = useState<SaveData[]>([]);
  const [saveDrawerOpen, setSaveDrawerOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setInterval>>();

  // Load VN data and existing saves
  useEffect(() => {
    if (!vnId) return;

    let cancelled = false;
    const timeoutId = setTimeout(() => {
      if (!cancelled) setError('Tempo limite excedido. Tente novamente.');
    }, 15_000);

    api.getVN(vnId)
      .then((vnRes) => {
        if (cancelled) return;
        clearTimeout(timeoutId);

        if (vnRes.success && vnRes.data) {
          const vn = vnRes.data as any;
          setStoryTitle(vn.title ?? 'Visual Novel');
          startGame(vn);
          loadSaves();
        } else {
          setError(vnRes.error?.message ?? 'Não foi possível carregar esta visual novel.');
        }
      })
      .catch(() => {
        if (!cancelled) {
          clearTimeout(timeoutId);
          setError('Erro ao carregar a história.');
        }
      });

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [vnId]);

  // Auto-save every 60 seconds
  useEffect(() => {
    autoSaveTimer.current = setInterval(() => {
      if (currentScene) {
        handleQuickSave();
      }
    }, 60_000);
    return () => clearInterval(autoSaveTimer.current);
  }, [currentScene]);

  // ── Saves ──────────────────────────────────────────────

  const loadSaves = useCallback(async () => {
    if (!vnId) return;
    const res = await api.getSaves(vnId);
    if (res.success && res.data) setSaves(res.data as SaveData[]);
  }, [vnId]);

  const handleQuickSave = useCallback(async () => {
    try {
      const save = createSave(1, 'Auto Save');
      await api.createSave(save);
      setToast('Progresso salvo!');
      loadSaves();
    } catch { /* silent */ }
  }, [createSave, vnId]);

  const handleSaveToSlot = useCallback(async (slot: number) => {
    try {
      const save = createSave(slot, `Save ${slot}`);
      await api.createSave(save);
      setToast(`Salvo no slot ${slot}!`);
      setSaveDrawerOpen(false);
      loadSaves();
    } catch {
      setError('Erro ao salvar.');
    }
  }, [createSave, vnId]);

  const handleLoadSave = useCallback(async (save: SaveData) => {
    if (!vnId) return;
    const res = await api.getVN(vnId);
    if (res.success && res.data) {
      startGame(res.data as any, save);
      setToast('Save carregado!');
      setSaveDrawerOpen(false);
    }
  }, [startGame, vnId]);

  const handleLLMGeneration = useCallback(async () => {
    try {
      const res = await api.generateLLM({
        prompt: 'Continue a história naturalmente',
        context: { storyTitle, currentScene: currentScene?.content?.[0]?.text ?? '', flags: {} },
        config: { modelType: 'lfm-230m', temperature: 0.7, maxTokens: 500, topP: 0.9, systemPrompt: '', persona: '' },
      });
      if (res.success && res.data) {
        setToast('IA gerou a continuação!');
      }
    } catch { /* fallback to local */ }
  }, [currentScene, storyTitle]);

  // ── Render ─────────────────────────────────────────────

  if (error) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60dvh', gap: 2 }}>
        <Alert severity="error" sx={{ maxWidth: 500 }}>{error}</Alert>
        <Button variant="outlined" onClick={() => navigate('/library')}>Voltar à Biblioteca</Button>
      </Box>
    );
  }

  if (!currentScene) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60dvh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', position: 'relative' }}>
      {/* Top bar */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
        <IconButton onClick={() => navigate('/library')} aria-label="Voltar à biblioteca">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" sx={{ flexGrow: 1, fontFamily: '"Playfair Display", serif' }}>
          {storyTitle}
        </Typography>
        {isLLMScene && (
          <Chip label="IA" size="small" color="secondary" variant="outlined" sx={{ mr: 1 }} />
        )}
        <IconButton onClick={handleQuickSave} aria-label="Salvar rápido" title="Quick Save">
          <SaveIcon />
        </IconButton>
        <IconButton onClick={() => { loadSaves(); setSaveDrawerOpen(true); }} aria-label="Abrir saves" title="Saves">
          <FolderOpenIcon />
        </IconButton>
      </Box>

      {/* Progress bar */}
      <Box sx={{ width: '100%', height: 3, bgcolor: 'rgba(255,255,255,0.05)', mb: 3, borderRadius: 1 }}>
        <Box sx={{ width: '30%', height: '100%', bgcolor: 'primary.main', borderRadius: 1, transition: 'width 0.5s' }} />
      </Box>

      {/* Scene content */}
      <Box sx={{ mb: 2, minHeight: '40dvh' }}>
        <SceneRenderer scene={currentScene} isLLMGenerated={isLLMScene} />
      </Box>

      {/* Choices or Continue */}
      <Box sx={{ mt: 3, mb: 6 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : availableChoices.length > 0 ? (
          <ChoicePanel choices={availableChoices} onSelect={makeChoice} />
        ) : (
          <Button
            variant="contained"
            onClick={() => { continueGame(); }}
            fullWidth
            sx={{ py: 1.5, fontSize: '1.1rem', borderRadius: 3 }}
          >
            Continuar ▸
          </Button>
        )}
      </Box>

      {/* Save/Load Drawer */}
      <Drawer anchor="right" open={saveDrawerOpen} onClose={() => setSaveDrawerOpen(false)}>
        <Box sx={{ width: 300, p: 3 }}>
          <Typography variant="h6" mb={2}>Saves</Typography>

          <Typography variant="subtitle2" color="text.secondary" mb={1}>Salvar</Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            {[1, 2, 3, 4, 5].map((slot) => (
              <Button key={slot} variant="outlined" size="small" onClick={() => handleSaveToSlot(slot)}>
                Slot {slot}
              </Button>
            ))}
          </Box>

          <Typography variant="subtitle2" color="text.secondary" mb={1}>Carregar</Typography>
          <List dense>
            {saves.length === 0 && (
              <Typography variant="body2" color="text.secondary">Nenhum save encontrado.</Typography>
            )}
            {saves.map((save) => (
              <ListItemButton key={save.id} onClick={() => handleLoadSave(save)}>
                <ListItemText
                  primary={save.label}
                  secondary={new Date(save.updatedAt).toLocaleString('pt-BR')}
                />
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Toast notification */}
      <Snackbar
        open={!!toast}
        autoHideDuration={2000}
        onClose={() => setToast(null)}
        message={toast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}

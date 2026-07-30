import {
  Box,
  Typography,
  Button,
  CircularProgress,
  IconButton,
  Tooltip,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Chip,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SaveIcon from '@mui/icons-material/Save';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import DeleteIcon from '@mui/icons-material/Delete';
import { useParams, useNavigate } from 'react-router-dom';
import { useVNEngine } from '@zan-vn/lib';
import { SceneRenderer, ChoicePanel } from '@zan-vn/ui';
import { useState, useEffect, useCallback, useRef } from 'react';
import type { SaveData, StoryData } from '@zan-vn/shared';
import { useAuth } from '../providers/auth-provider.js';
import { useModel } from '../providers/model-provider.js';
import { ModelLoadingScreen } from '../components/model-loading-screen.js';

export function PlayerPage() {
  const { vnId } = useParams<{ vnId: string }>();
  const { api, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const {
    currentScene,
    availableChoices,
    isLLMScene,
    isLoading,
    isGeneratingLLM,
    startGame,
    continueGame,
    makeChoice,
    createSave,
    setLLMProvider,
  } = useVNEngine();

  // LLM provider from app-level ModelProvider (persists across navigations)
  const { llmProvider, modelStatus, modelProgress, modelStatusText, modelDevice } = useModel();

  useEffect(() => {
    if (llmProvider) {
      setLLMProvider(llmProvider);
    }
  }, [llmProvider, setLLMProvider]);

  const [storyTitle, setStoryTitle] = useState('');
  const [saves, setSaves] = useState<SaveData[]>([]);
  const [saveDrawerOpen, setSaveDrawerOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creditsGate, setCreditsGate] = useState<{ priceCredits: number } | null>(null);
  const [spending, setSpending] = useState(false);
  const autoSaveTimer = useRef<ReturnType<typeof setInterval>>(undefined);

  // New state for polish
  const [storyData, setStoryData] = useState<StoryData | null>(null);
  const [progress, setProgress] = useState(0);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [saveToDelete, setSaveToDelete] = useState<string | null>(null);
  const [lastSaveTime, setLastSaveTime] = useState<number | null>(null);
  const [lastSaveLabel, setLastSaveLabel] = useState('');
  const [relativeTime, setRelativeTime] = useState('');

  // Load VN data and existing saves
  useEffect(() => {
    if (!vnId) return;

    let cancelled = false;
    const timeoutId = setTimeout(() => {
      if (!cancelled) setError('Tempo limite excedido. Tente novamente.');
    }, 15_000);

    api
      .getVN(vnId)
      .then((vnRes) => {
        if (cancelled) return;
        clearTimeout(timeoutId);

        if (vnRes.success && vnRes.data) {
          const vn = vnRes.data as StoryData;
          if (!vn.chapters || vn.chapters.length === 0) {
            setError('Esta visual novel ainda não tem capítulos publicados.');
            clearTimeout(timeoutId);
            return;
          }
          setStoryTitle(vn.title ?? 'Visual Novel');

          // Anti-bypass: block direct URL access to paid VNs (unless already purchased)
          if ((vn as any).priceCredits > 0 && !(vn as any).hasAccess) {
            setCreditsGate({ priceCredits: (vn as any).priceCredits });
            return;
          }

          setStoryData(vn);
          startGame(vn);
          if (isAuthenticated) {
            loadSaves();
          }
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

  // Auto-save every 60 seconds (skips during transitions, requires auth)
  const isAuthenticatedRef = useRef(isAuthenticated);
  isAuthenticatedRef.current = isAuthenticated;

  useEffect(() => {
    if (!isAuthenticatedRef.current) return;
    autoSaveTimer.current = setInterval(() => {
      if (currentScene && !isLoading) {
        handleQuickSave();
      }
    }, 60_000);
    return () => clearInterval(autoSaveTimer.current);
  }, [isLoading]);

  // Progress bar calculation
  useEffect(() => {
    if (!currentScene || !storyData) return;
    const currentChapter = storyData.chapters.find((c) => c.id === currentScene.chapterId);
    const chapterIndex = currentChapter?.orderIndex ?? 0;
    const total = storyData.chapters.length;
    setProgress(total > 0 ? ((chapterIndex + 1) / total) * 100 : 0);
  }, [currentScene, storyData]);

  // Last save relative time indicator
  useEffect(() => {
    if (lastSaveTime === null) return;
    const update = () => {
      const diff = Math.floor((Date.now() - lastSaveTime) / 1000);
      if (diff < 60) setRelativeTime(`Salvo há ${diff}s`);
      else {
        setRelativeTime(
          `${lastSaveLabel}: ${new Date(lastSaveTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
        );
      }
    };
    update();
    const interval = setInterval(update, 5000);
    return () => clearInterval(interval);
  }, [lastSaveTime, lastSaveLabel]);

  // ── Saves ──────────────────────────────────────────────

  const loadSaves = useCallback(async () => {
    if (!vnId) return;
    const res = await api.getSaves(vnId);
    if (res.success && res.data) setSaves(res.data as SaveData[]);
  }, [vnId]);

  const handleQuickSave = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const save = createSave(1, 'Auto Save');
      await api.createSave(save);
      setToast('Progresso salvo!');
      setLastSaveTime(Date.now());
      setLastSaveLabel(save.label);
      loadSaves();
    } catch {
      /* silent */
    }
  }, [createSave, vnId, isAuthenticated]);

  const handleSaveToSlot = useCallback(
    async (slot: number) => {
      if (!isAuthenticated) {
        setToast('Faça login para salvar seu progresso.');
        return;
      }
      try {
        const save = createSave(slot, `Save ${slot}`);
        await api.createSave(save);
        setToast(`Salvo no slot ${slot}!`);
        setSaveDrawerOpen(false);
        setLastSaveTime(Date.now());
        setLastSaveLabel(save.label);
        loadSaves();
      } catch {
        setError('Erro ao salvar.');
      }
    },
    [createSave, vnId, isAuthenticated],
  );

  const handleLoadSave = useCallback(
    async (save: SaveData) => {
      if (!vnId || !storyData) return;
      startGame(storyData, save);
      setToast('Save carregado!');
      setSaveDrawerOpen(false);
    },
    [startGame, vnId, storyData],
  );

  // ── Render ─────────────────────────────────────────────

  if (error) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60dvh',
          gap: 2,
        }}
      >
        <Alert severity="error" sx={{ maxWidth: 500 }}>
          {error}
        </Alert>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" onClick={() => window.location.reload()}>
            Tentar novamente
          </Button>
          <Button variant="outlined" onClick={() => navigate('/library')}>
            Voltar à Biblioteca
          </Button>
        </Box>
      </Box>
    );
  }

  if (creditsGate) {
    const handleCreditsPurchase = async () => {
      if (!vnId) return;
      setSpending(true);
      try {
        const res = await (api as any).spendCredits(vnId, creditsGate.priceCredits);
        if (res.success) {
          setCreditsGate(null);
          // Reload VN data to proceed
          window.location.reload();
        } else {
          setError(res.error?.message ?? 'Erro ao processar pagamento.');
        }
      } catch {
        setError('Erro ao conectar com o servidor.');
      } finally {
        setSpending(false);
      }
    };

    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60dvh',
          gap: 2,
        }}
      >
        <Alert severity="warning" sx={{ maxWidth: 500 }}>
          Esta visual novel requer {creditsGate.priceCredits} créditos para jogar. Você tem{' '}
          {user?.creditsBalance ?? 0} créditos.
        </Alert>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" onClick={() => navigate('/library')}>
            Voltar à Biblioteca
          </Button>
          <Button
            variant="contained"
            onClick={handleCreditsPurchase}
            disabled={spending || (user?.creditsBalance ?? 0) < creditsGate.priceCredits}
          >
            {spending ? 'Processando...' : `Comprar (${creditsGate.priceCredits} créditos)`}
          </Button>
        </Box>
      </Box>
    );
  }

  if (!currentScene) {
    return (
      <ModelLoadingScreen
        status={isGeneratingLLM ? 'loading' : modelStatus}
        progress={modelProgress}
        statusText={isGeneratingLLM ? 'Gerando narrativa com IA...' : modelStatusText}
        device={modelDevice}
      />
    );
  }

  return (
    <Box sx={{ maxWidth: 'var(--content-md)', mx: 'auto', position: 'relative' }}>
      {/* Top bar */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
        <Tooltip title="Voltar à biblioteca">
          <IconButton onClick={() => navigate('/library')} aria-label="Voltar à biblioteca">
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>
        <Typography variant="h6" sx={{ flexGrow: 1, fontFamily: '"Playfair Display", serif' }}>
          {storyTitle}
        </Typography>
        {isLLMScene && (
          <Tooltip title="Este conteúdo foi gerado por IA" arrow>
            <Chip label="IA" size="small" color="secondary" variant="outlined" sx={{ mr: 1 }} />
          </Tooltip>
        )}
        {relativeTime && (
          <Typography variant="caption" color="text.secondary" sx={{ mr: 1, fontSize: '0.7rem' }}>
            {relativeTime}
          </Typography>
        )}
        <Tooltip title="Salvar progresso">
          <IconButton onClick={handleQuickSave} aria-label="Salvar rápido">
            <SaveIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Abrir saves">
          <IconButton
            onClick={() => {
              loadSaves();
              setSaveDrawerOpen(true);
            }}
            aria-label="Abrir saves"
          >
            <FolderOpenIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Progress bar */}
      <Tooltip
        title={
          currentScene?.chapterId
            ? (storyData?.chapters.find((c) => c.id === currentScene.chapterId)?.title ??
              `Capítulo ${Math.round(progress)}%`)
            : ''
        }
        arrow
      >
        <Box
          sx={{
            width: '100%',
            height: 6,
            bgcolor: 'rgba(255,255,255,0.05)',
            mb: 3,
            borderRadius: 1,
            cursor: 'pointer',
          }}
        >
          <Box
            sx={{
              width: `${progress}%`,
              height: '100%',
              bgcolor: 'secondary.main',
              borderRadius: 1,
              transition: 'width 0.5s',
            }}
          />
        </Box>
      </Tooltip>

      {/* Scene content */}
      <Box sx={{ mb: 2, minHeight: '40dvh' }}>
        <SceneRenderer scene={currentScene} isLLMGenerated={isLLMScene} />
      </Box>

      {/* Choices or Continue or Ending */}
      <Box sx={{ mt: 3, mb: 6 }}>
        {isGeneratingLLM ? (
          <Box
            sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6, gap: 2 }}
          >
            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
              <CircularProgress size={48} sx={{ color: 'var(--color-secondary)' }} />
              <Box
                sx={{
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                  position: 'absolute',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ color: 'var(--color-secondary)', fontSize: '0.65rem' }}
                >
                  IA
                </Typography>
              </Box>
            </Box>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ animation: 'vn-pulse 1.5s ease-in-out infinite' }}
            >
              Gerando continuação com IA...
            </Typography>
          </Box>
        ) : isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : availableChoices.length > 0 ? (
          <ChoicePanel choices={availableChoices} onSelect={makeChoice} />
        ) : currentScene?.type === 'ending' ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="h5" color="primary" fontWeight={700} mb={2}>
              Fim da História
            </Typography>
            <Button
              variant="outlined"
              onClick={() => navigate('/library')}
              sx={{ borderRadius: 3 }}
            >
              Voltar à Biblioteca
            </Button>
          </Box>
        ) : isLLMScene ? (
          <Button
            variant="outlined"
            onClick={() => navigate('/library')}
            fullWidth
            sx={{
              py: 1.5,
              fontSize: '1.1rem',
              borderRadius: 3,
              animation: 'vn-fade-in-up 0.5s ease-out',
            }}
          >
            Voltar à Biblioteca
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={continueGame}
            fullWidth
            sx={{ py: 1.5, fontSize: '1.1rem', borderRadius: 3 }}
            endIcon={<ArrowForwardIcon />}
          >
            Continuar
          </Button>
        )}
      </Box>

      {/* Save/Load Drawer */}
      <Drawer anchor="right" open={saveDrawerOpen} onClose={() => setSaveDrawerOpen(false)}>
        <Box sx={{ width: 300, p: 3 }}>
          <Typography variant="h6" mb={2}>
            Saves
          </Typography>

          <Typography variant="subtitle2" color="text.secondary" mb={1}>
            Salvar
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            {[1, 2, 3, 4, 5].map((slot) => (
              <Button
                key={slot}
                variant="outlined"
                size="small"
                onClick={() => handleSaveToSlot(slot)}
              >
                Slot {slot}
              </Button>
            ))}
          </Box>

          <Typography variant="subtitle2" color="text.secondary" mb={1}>
            Carregar
          </Typography>
          <List dense>
            {saves.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                Nenhum save encontrado.
              </Typography>
            )}
            {saves.map((save) => (
              <ListItemButton key={save.id} onClick={() => handleLoadSave(save)}>
                <ListItemText
                  primary={save.label}
                  secondary={new Date(save.updatedAt).toLocaleString('pt-BR')}
                />
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSaveToDelete(save.id);
                    setDeleteConfirmOpen(true);
                  }}
                  aria-label={`Deletar ${save.label}`}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
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

      {/* Delete confirmation dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Deletar Save</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja deletar este save? Esta ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancelar</Button>
          <Button
            color="error"
            onClick={async () => {
              if (saveToDelete) {
                const res = await api.deleteSave(saveToDelete);
                if (res.success) {
                  setDeleteConfirmOpen(false);
                  setSaveToDelete(null);
                  setToast('Save deletado.');
                  loadSaves();
                } else {
                  setError(res.error?.message ?? 'Erro ao deletar save.');
                  setDeleteConfirmOpen(false);
                  setSaveToDelete(null);
                }
              }
            }}
          >
            Deletar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

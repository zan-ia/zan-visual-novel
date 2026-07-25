import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Tabs,
  Tab,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Snackbar,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PublishIcon from '@mui/icons-material/Publish';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Chapter, Scene, TextBlock, Choice } from '@zan-vn/shared';
import { useAuth } from '../providers/auth-provider.js';

type TabValue = 'details' | 'chapters' | 'scenes' | 'preview';

export function VNEditorPage() {
  const { vnId } = useParams<{ vnId: string }>();
  const { api } = useAuth();
  const navigate = useNavigate();
  const isNew = vnId === 'new';

  // ── State ──────────────────────────────────────────────
  const [tab, setTab] = useState<TabValue>('details');
  const [title, setTitle] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Chapter dialog
  const [chapterDialogOpen, setChapterDialogOpen] = useState(false);
  const [chapterTitle, setChapterTitle] = useState('');

  // Scene editing
  const [sceneContent, setSceneContent] = useState<TextBlock[]>([]);
  const [sceneType, setSceneType] = useState<string>('narration');
  const [sceneTitle, setSceneTitle] = useState('');
  const [currentTextBlock, setCurrentTextBlock] = useState('');
  const [currentSpeaker, setCurrentSpeaker] = useState('');
  const [blockType, setBlockType] = useState<'narration' | 'dialogue' | 'thought'>('narration');

  // Choice editing
  const [choices, setChoices] = useState<Choice[]>([]);
  const [newChoiceText, setNewChoiceText] = useState('');
  const [newChoiceTarget, setNewChoiceTarget] = useState('');

  // ── Load VN data ───────────────────────────────────────

  useEffect(() => {
    if (isNew || !vnId) return;
    api.getVN(vnId).then((res) => {
      if (res.success && res.data) {
        const vn = res.data as any;
        setTitle(vn.title ?? '');
        setSynopsis(vn.synopsis ?? '');
        const chs = (vn.chapters ?? []) as Chapter[];
        setChapters(chs);
        if (chs.length > 0) {
          setSelectedChapterId(chs[0]!.id);
          setScenes(chs[0]!.scenes ?? []);
        }
      }
    });
  }, [vnId, isNew]);

  // Load scenes when chapter changes
  useEffect(() => {
    if (!selectedChapterId) {
      setScenes([]);
      return;
    }
    const chapter = chapters.find((c) => c.id === selectedChapterId);
    setScenes((chapter as any)?.scenes ?? []);
  }, [selectedChapterId, chapters]);

  // Load scene content and choices when scene changes
  useEffect(() => {
    if (!selectedSceneId) {
      setSceneContent([]);
      setChoices([]);
      setSceneTitle('');
      return;
    }
    const scene = scenes.find((s) => s.id === selectedSceneId);
    if (scene) {
      setSceneContent(scene.content ?? []);
      setChoices((scene as any)?.choices ?? []);
      setSceneTitle(scene.title ?? '');
      setSceneType(scene.type ?? 'narration');
    }
  }, [selectedSceneId, scenes]);

  // ── VN Metadata ────────────────────────────────────────

  const handleSaveVN = async () => {
    setLoading(true);
    try {
      const data = { title, synopsis };
      if (isNew) {
        const res = await api.createVN(data);
        if (res.success && res.data) {
          navigate(`/studio/${(res.data as any).id}`);
        }
      } else {
        await api.updateVN(vnId!, data);
        setToast('Visual Novel salva!');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!vnId) return;
    setLoading(true);
    try {
      await api.updateVN(vnId, { status: 'published' });
      setToast('Visual Novel publicada! 🎉');
    } finally {
      setLoading(false);
    }
  };

  // ── Chapters ───────────────────────────────────────────

  const handleAddChapter = async () => {
    if (!chapterTitle.trim() || !vnId) return;
    // Chapter creation via API would go here
    // For MVP, we manage locally
    const newChapter: Chapter = {
      id: `ch-${Date.now()}`,
      vnId,
      title: chapterTitle,
      orderIndex: chapters.length,
      status: 'draft',
      priceCredits: 0,
      startSceneId: null,
      scenes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setChapters([...chapters, newChapter]);
    setSelectedChapterId(newChapter.id);
    setChapterDialogOpen(false);
    setChapterTitle('');
    setToast('Capítulo adicionado!');
  };

  const handleDeleteChapter = (id: string) => {
    setChapters(chapters.filter((c) => c.id !== id));
    if (selectedChapterId === id) setSelectedChapterId(null);
  };

  // ── Scenes ─────────────────────────────────────────────

  const handleAddScene = () => {
    if (!selectedChapterId) return;
    const newScene: Scene = {
      id: `sc-${Date.now()}`,
      chapterId: selectedChapterId,
      title: `Cena ${scenes.length + 1}`,
      type: 'narration',
      content: [],
      nextSceneId: null,
      metadata: null,
      choices: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [...scenes, newScene];
    setScenes(updated);
    setSelectedSceneId(newScene.id);
    setToast('Cena adicionada!');
  };

  // ── Text Blocks ────────────────────────────────────────

  const handleAddTextBlock = () => {
    if (!currentTextBlock.trim()) return;
    const block: TextBlock = {
      type: blockType,
      speaker: blockType === 'dialogue' ? currentSpeaker || undefined : undefined,
      text: currentTextBlock,
      style: 'normal',
    };
    setSceneContent([...sceneContent, block]);
    setCurrentTextBlock('');
    setCurrentSpeaker('');
  };

  const handleRemoveTextBlock = (index: number) => {
    setSceneContent(sceneContent.filter((_, i) => i !== index));
  };

  // ── Choices ────────────────────────────────────────────

  const handleAddChoice = () => {
    if (!newChoiceText.trim() || !selectedSceneId) return;
    const choice: Choice = {
      id: `chc-${Date.now()}`,
      sceneId: selectedSceneId,
      text: newChoiceText,
      targetSceneId: newChoiceTarget || selectedSceneId,
      orderIndex: choices.length,
      isDefault: false,
    };
    setChoices([...choices, choice]);
    setNewChoiceText('');
    setNewChoiceTarget('');
  };

  // ── Render ─────────────────────────────────────────────

  const selectedScene = scenes.find((s) => s.id === selectedSceneId);

  return (
    <Box sx={{ maxWidth: 1200 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">
          {isNew ? 'Nova Visual Novel' : title || 'Editor de VN'}
        </Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<PlayArrowIcon />}
            onClick={() => setTab('preview')}
          >
            Preview
          </Button>
          <Button
            variant="contained"
            startIcon={<PublishIcon />}
            onClick={handlePublish}
            disabled={loading}
          >
            Publicar
          </Button>
        </Box>
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label="Detalhes" value="details" />
        <Tab label="Capítulos" value="chapters" />
        <Tab label="Cenas" value="scenes" disabled={!selectedChapterId} />
        <Tab label="Preview" value="preview" disabled={!selectedSceneId} />
      </Tabs>

      {/* ── Details Tab ─────────────────────────────────── */}
      {tab === 'details' && (
        <Paper sx={{ p: 4, maxWidth: 800 }}>
          <TextField
            fullWidth
            label="Título"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Sinopse"
            value={synopsis}
            onChange={(e) => setSynopsis(e.target.value)}
            margin="normal"
            multiline
            rows={4}
          />
          <Box mt={3} display="flex" gap={2}>
            <Button variant="contained" onClick={handleSaveVN} disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button variant="outlined" onClick={() => navigate('/studio')}>
              Cancelar
            </Button>
          </Box>
        </Paper>
      )}

      {/* ── Chapters Tab ────────────────────────────────── */}
      {tab === 'chapters' && (
        <Box display="flex" gap={3}>
          <Paper sx={{ width: 300, p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Capítulos</Typography>
              <IconButton onClick={() => setChapterDialogOpen(true)} color="primary">
                <AddIcon />
              </IconButton>
            </Box>
            <List dense>
              {chapters.map((ch) => (
                <ListItemButton
                  key={ch.id}
                  selected={selectedChapterId === ch.id}
                  onClick={() => setSelectedChapterId(ch.id)}
                >
                  <ListItemIcon>
                    <DragIndicatorIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={ch.title}
                    secondary={`${(ch as any)?.scenes?.length ?? 0} cenas`}
                  />
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteChapter(ch.id);
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </ListItemButton>
              ))}
              {chapters.length === 0 && (
                <Typography color="text.secondary" textAlign="center" py={2}>
                  Nenhum capítulo. Clique + para adicionar.
                </Typography>
              )}
            </List>
          </Paper>

          {/* Chapter detail */}
          {selectedChapterId && (
            <Paper sx={{ flex: 1, p: 3 }}>
              <Typography variant="h6" mb={2}>
                {chapters.find((c) => c.id === selectedChapterId)?.title ?? 'Capítulo'}
              </Typography>
              <Typography color="text.secondary" mb={1}>
                {scenes.length} cenas neste capítulo
              </Typography>
              <Button variant="outlined" onClick={() => setTab('scenes')}>
                Editar Cenas →
              </Button>
            </Paper>
          )}
        </Box>
      )}

      {/* ── Scenes Tab ──────────────────────────────────── */}
      {tab === 'scenes' && (
        <Box display="flex" gap={3}>
          {/* Scene list */}
          <Paper sx={{ width: 280, p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="subtitle1">Cenas</Typography>
              <IconButton onClick={handleAddScene} color="primary">
                <AddIcon />
              </IconButton>
            </Box>
            <List dense>
              {scenes.map((sc) => (
                <ListItemButton
                  key={sc.id}
                  selected={selectedSceneId === sc.id}
                  onClick={() => setSelectedSceneId(sc.id)}
                >
                  <ListItemText
                    primary={sc.title}
                    secondary={`${sc.content?.length ?? 0} blocos · ${(sc as any)?.choices?.length ?? 0} escolhas`}
                  />
                  <Chip label={sc.type} size="small" variant="outlined" />
                </ListItemButton>
              ))}
            </List>
          </Paper>

          {/* Scene editor */}
          {selectedScene && (
            <Box flex={1} display="flex" gap={2} flexDirection="column">
              <Paper sx={{ p: 3 }}>
                <TextField
                  fullWidth
                  label="Título da Cena"
                  value={sceneTitle}
                  onChange={(e) => setSceneTitle(e.target.value)}
                  margin="normal"
                />
                <FormControl fullWidth margin="normal">
                  <InputLabel>Tipo</InputLabel>
                  <Select
                    value={sceneType}
                    onChange={(e) => setSceneType(e.target.value)}
                    label="Tipo"
                  >
                    <MenuItem value="narration">Narração</MenuItem>
                    <MenuItem value="dialogue">Diálogo</MenuItem>
                    <MenuItem value="choice">Escolha</MenuItem>
                    <MenuItem value="ending">Final</MenuItem>
                  </Select>
                </FormControl>
              </Paper>

              {/* Text blocks */}
              <Paper sx={{ p: 3 }}>
                <Typography variant="subtitle1" mb={2}>
                  Blocos de Texto
                </Typography>
                {sceneContent.map((block, i) => (
                  <Box
                    key={i}
                    sx={{
                      mb: 2,
                      p: 2,
                      bgcolor: 'rgba(255,255,255,0.03)',
                      borderRadius: 1,
                      position: 'relative',
                    }}
                  >
                    <Box display="flex" gap={1} mb={1}>
                      <Chip label={block.type} size="small" color="primary" variant="outlined" />
                      {block.speaker && <Chip label={block.speaker} size="small" />}
                    </Box>
                    <Typography variant="body2">{block.text}</Typography>
                    <IconButton
                      size="small"
                      sx={{ position: 'absolute', top: 4, right: 4 }}
                      onClick={() => handleRemoveTextBlock(i)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}

                <Box display="flex" gap={1} flexWrap="wrap" mt={2}>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <Select value={blockType} onChange={(e) => setBlockType(e.target.value as any)}>
                      <MenuItem value="narration">Narração</MenuItem>
                      <MenuItem value="dialogue">Diálogo</MenuItem>
                      <MenuItem value="thought">Pensamento</MenuItem>
                    </Select>
                  </FormControl>
                  {blockType === 'dialogue' && (
                    <TextField
                      size="small"
                      label="Personagem"
                      value={currentSpeaker}
                      onChange={(e) => setCurrentSpeaker(e.target.value)}
                      sx={{ width: 150 }}
                    />
                  )}
                  <TextField
                    size="small"
                    label="Texto"
                    value={currentTextBlock}
                    onChange={(e) => setCurrentTextBlock(e.target.value)}
                    sx={{ flex: 1, minWidth: 200 }}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTextBlock()}
                  />
                  <Button variant="outlined" size="small" onClick={handleAddTextBlock}>
                    Adicionar
                  </Button>
                </Box>
              </Paper>

              {/* Choices editor */}
              <Paper sx={{ p: 3 }}>
                <Typography variant="subtitle1" mb={2}>
                  Escolhas
                </Typography>
                {choices.map((ch) => (
                  <Box key={ch.id} display="flex" gap={1} alignItems="center" mb={1}>
                    <Chip
                      label={`→ ${ch.targetSceneId?.slice(0, 8)}...`}
                      size="small"
                      variant="outlined"
                    />
                    <Typography variant="body2" sx={{ flex: 1 }}>
                      {ch.text}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => setChoices(choices.filter((c) => c.id !== ch.id))}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
                <Box display="flex" gap={1} mt={2}>
                  <TextField
                    size="small"
                    label="Texto da escolha"
                    value={newChoiceText}
                    onChange={(e) => setNewChoiceText(e.target.value)}
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    size="small"
                    label="ID da cena alvo"
                    value={newChoiceTarget}
                    onChange={(e) => setNewChoiceTarget(e.target.value)}
                    sx={{ width: 180 }}
                  />
                  <Button variant="outlined" size="small" onClick={handleAddChoice}>
                    +
                  </Button>
                </Box>
              </Paper>
            </Box>
          )}
        </Box>
      )}

      {/* ── Preview Tab ──────────────────────────────────── */}
      {tab === 'preview' && selectedScene && (
        <Paper sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
          <Typography variant="h6" mb={3}>
            Preview — {selectedScene.title}
          </Typography>
          <Box sx={{ bgcolor: 'rgba(0,0,0,0.3)', p: 3, borderRadius: 2, mb: 3 }}>
            {selectedScene.content?.map((block, i) => {
              if (block.type === 'dialogue') {
                return (
                  <Box key={i} mb={2}>
                    {block.speaker && (
                      <Typography variant="caption" color="primary.main" fontWeight="bold">
                        {block.speaker}
                      </Typography>
                    )}
                    <Typography>"{block.text}"</Typography>
                  </Box>
                );
              }
              if (block.type === 'thought') {
                return (
                  <Typography key={i} mb={2} color="text.secondary" fontStyle="italic">
                    ({block.text})
                  </Typography>
                );
              }
              return (
                <Typography key={i} mb={2}>
                  {block.text}
                </Typography>
              );
            }) ?? <Typography color="text.secondary">Cena vazia.</Typography>}
          </Box>
          {choices.length > 0 && (
            <Box>
              <Typography variant="subtitle2" mb={1}>
                Escolhas:
              </Typography>
              {choices.map((ch) => (
                <Button
                  key={ch.id}
                  variant="outlined"
                  fullWidth
                  sx={{ mb: 1, justifyContent: 'flex-start' }}
                >
                  {ch.text}
                </Button>
              ))}
            </Box>
          )}
        </Paper>
      )}

      {/* ── Chapter Dialog ───────────────────────────────── */}
      <Dialog open={chapterDialogOpen} onClose={() => setChapterDialogOpen(false)}>
        <DialogTitle>Novo Capítulo</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Título do capítulo"
            value={chapterTitle}
            onChange={(e) => setChapterTitle(e.target.value)}
            margin="dense"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChapterDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleAddChapter}>
            Criar
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Toast ────────────────────────────────────────── */}
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

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
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
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

  // Text block inline editing
  const [editingBlockIndex, setEditingBlockIndex] = useState<number | null>(null);
  const [editingBlockText, setEditingBlockText] = useState('');
  const [editingBlockType, setEditingBlockType] = useState<'narration' | 'dialogue' | 'thought'>('narration');
  const [editingBlockSpeaker, setEditingBlockSpeaker] = useState('');

  // Choice editing
  const [choices, setChoices] = useState<Choice[]>([]);
  const [newChoiceText, setNewChoiceText] = useState('');
  const [newChoiceTarget, setNewChoiceTarget] = useState('');

  // Choice inline editing
  const [editingChoiceId, setEditingChoiceId] = useState<string | null>(null);
  const [editingChoiceText, setEditingChoiceText] = useState('');
  const [editingChoiceTarget, setEditingChoiceTarget] = useState('');

  // ── Load VN data ───────────────────────────────────────

  const sortScenes = (list: Scene[]) => {
    return [...list].sort(
      (a, b) => ((a.metadata as any)?.orderIndex ?? list.indexOf(a)) - ((b.metadata as any)?.orderIndex ?? list.indexOf(b)),
    );
  };

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
          setScenes(sortScenes(chs[0]!.scenes ?? []));
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
    setScenes(sortScenes((chapter as any)?.scenes ?? []));
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
      const res = await api.updateVN(vnId, { status: 'published' });
      if (res.success) {
        setToast('Visual Novel publicada! 🎉');
      } else {
        const msg = (res as any).error?.message ?? 'Erro ao publicar';
        setToast(msg);
      }
    } catch {
      setToast('Erro ao publicar VN');
    } finally {
      setLoading(false);
    }
  };

  // ── Chapters ───────────────────────────────────────────

  const handleAddChapter = async () => {
    if (!chapterTitle.trim() || !vnId) return;
    setLoading(true);
    try {
      const res = await api.createChapter(vnId, { title: chapterTitle, priceCredits: 0 });
      if (res.success && res.data) {
        const newChapter = res.data as Chapter;
        setChapters([...chapters, newChapter]);
        setSelectedChapterId(newChapter.id);
        setChapterDialogOpen(false);
        setChapterTitle('');
        setToast('Capítulo criado!');
      }
    } catch {
      setToast('Erro ao criar capítulo');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChapter = async (id: string) => {
    if (!vnId) return;
    setLoading(true);
    try {
      const res = await api.deleteChapter(vnId, id);
      if (res.success) {
        setChapters(chapters.filter((c) => c.id !== id));
        if (selectedChapterId === id) {
          setSelectedChapterId(null);
          setScenes([]);
        }
        setToast('Capítulo removido');
      }
    } catch {
      setToast('Erro ao remover capítulo');
    } finally {
      setLoading(false);
    }
  };

  const handlePublishChapter = async (id: string) => {
    if (!vnId) return;
    setLoading(true);
    try {
      const res = await api.updateChapter(vnId, id, { status: 'published' });
      if (res.success) {
        setChapters((prev) =>
          prev.map((c) => (c.id === id ? { ...c, status: 'published' as const } : c)),
        );
        setToast('Capítulo publicado! ✅');
      } else {
        const msg = (res as any).error?.message ?? 'Erro ao publicar capítulo';
        setToast(msg);
      }
    } catch {
      setToast('Erro ao publicar capítulo');
    } finally {
      setLoading(false);
    }
  };

  // ── Scenes ─────────────────────────────────────────────

  const handleAddScene = async () => {
    if (!selectedChapterId || !vnId) return;
    setLoading(true);
    try {
      const res = await api.createScene(vnId, selectedChapterId, {
        title: `Cena ${scenes.length + 1}`,
        type: 'narration',
        content: [{ type: 'narration', text: 'Nova cena...', style: 'normal' }],
      });
      if (res.success && res.data) {
        const updated = [...scenes, res.data as Scene];
        setScenes(updated);
        setSelectedSceneId((res.data as Scene).id);
        setToast('Cena criada!');
      }
    } catch {
      setToast('Erro ao criar cena');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteScene = async (sceneId: string) => {
    if (!selectedChapterId || !vnId) return;
    setLoading(true);
    try {
      const res = await api.deleteScene(vnId, selectedChapterId, sceneId);
      if (res.success) {
        setScenes(scenes.filter((s) => s.id !== sceneId));
        if (selectedSceneId === sceneId) {
          setSelectedSceneId(null);
          setSceneContent([]);
          setChoices([]);
          setSceneTitle('');
        }
        setToast('Cena removida!');
      }
    } catch {
      setToast('Erro ao remover cena');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveScene = async (contentOverride?: TextBlock[]) => {
    if (!selectedSceneId || !selectedChapterId || !vnId) return;
    const content = contentOverride ?? sceneContent;
    setLoading(true);
    try {
      const res = await api.updateScene(vnId, selectedChapterId, selectedSceneId, {
        title: sceneTitle,
        type: sceneType,
        content,
      });
      if (res.success && res.data) {
        setScenes((prev) =>
          prev.map((s) => (s.id === selectedSceneId ? (res.data as Scene) : s)),
        );
      }
      setToast('Cena salva!');
    } catch {
      setToast('Erro ao salvar cena');
    } finally {
      setLoading(false);
    }
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
    const updated = [...sceneContent, block];
    setSceneContent(updated);
    setCurrentTextBlock('');
    setCurrentSpeaker('');
    handleSaveScene(updated);
  };

  const handleRemoveTextBlock = (index: number) => {
    const updated = sceneContent.filter((_, i) => i !== index);
    setSceneContent(updated);
    handleSaveScene(updated);
  };

  const startEditingBlock = (index: number) => {
    const block = sceneContent[index];
    if (!block) return;
    setEditingBlockIndex(index);
    setEditingBlockText(block.text);
    setEditingBlockType(block.type as 'narration' | 'dialogue' | 'thought');
    setEditingBlockSpeaker(block.speaker ?? '');
  };

  const cancelEditingBlock = () => {
    setEditingBlockIndex(null);
    setEditingBlockText('');
    setEditingBlockType('narration');
    setEditingBlockSpeaker('');
  };

  const handleUpdateTextBlock = () => {
    if (editingBlockIndex === null || !editingBlockText.trim()) return;
    const updated = sceneContent.map((block, i) =>
      i === editingBlockIndex
        ? {
            ...block,
            type: editingBlockType,
            text: editingBlockText,
            speaker: editingBlockType === 'dialogue' ? editingBlockSpeaker || undefined : undefined,
          }
        : block,
    );
    setSceneContent(updated);
    handleSaveScene(updated);
    cancelEditingBlock();
  };

  // ── Choices ────────────────────────────────────────────

  const handleAddChoice = async () => {
    if (!newChoiceText.trim() || !selectedSceneId || !selectedChapterId || !vnId) return;
    setLoading(true);
    try {
      const res = await api.createChoice(vnId, selectedChapterId, selectedSceneId, {
        text: newChoiceText,
        targetSceneId: newChoiceTarget || selectedSceneId,
        orderIndex: choices.length,
      });
      if (res.success && res.data) {
        setChoices([...choices, res.data as Choice]);
        setNewChoiceText('');
        setNewChoiceTarget('');
        setToast('Escolha adicionada!');
      }
    } catch {
      setToast('Erro ao adicionar escolha');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChoice = async (choiceId: string) => {
    if (!selectedSceneId || !selectedChapterId || !vnId) return;
    setLoading(true);
    try {
      const res = await api.deleteChoice(vnId, selectedChapterId, selectedSceneId, choiceId);
      if (res.success) {
        setChoices(choices.filter((c) => c.id !== choiceId));
        setToast('Escolha removida');
      }
    } catch {
      setToast('Erro ao remover escolha');
    } finally {
      setLoading(false);
    }
  };

  const startEditingChoice = (choice: Choice) => {
    setEditingChoiceId(choice.id);
    setEditingChoiceText(choice.text);
    setEditingChoiceTarget(choice.targetSceneId);
  };

  const cancelEditingChoice = () => {
    setEditingChoiceId(null);
    setEditingChoiceText('');
    setEditingChoiceTarget('');
  };

  const handleUpdateChoice = async () => {
    if (!editingChoiceId || !selectedSceneId || !selectedChapterId || !vnId) return;
    if (!editingChoiceText.trim()) return;
    setLoading(true);
    try {
      const res = await api.updateChoice(vnId, selectedChapterId, selectedSceneId, editingChoiceId, {
        text: editingChoiceText,
        targetSceneId: editingChoiceTarget || undefined,
      });
      if (res.success) {
        setChoices((prev) =>
          prev.map((c) =>
            c.id === editingChoiceId
              ? {
                  ...c,
                  text: editingChoiceText,
                  targetSceneId: editingChoiceTarget,
                }
              : c,
          ),
        );
        setToast('Escolha atualizada!');
        cancelEditingChoice();
      }
    } catch {
      setToast('Erro ao atualizar escolha');
    } finally {
      setLoading(false);
    }
  };

  // ── Reordering ────────────────────────────────────────

  const handleReorderScene = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= scenes.length) return;

    const updated = [...scenes];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setScenes(updated);

    // Persist new order via metadata.orderIndex
    if (!vnId) return;
    const chapterId = selectedChapterId;
    if (!chapterId) return;
    for (let i = 0; i < updated.length; i++) {
      const scene = updated[i];
      const currentOrder = (scene.metadata as any)?.orderIndex ?? i;
      if (currentOrder !== i) {
        await api.updateScene(vnId, chapterId, scene.id, {
          metadata: { ...(scene.metadata as Record<string, unknown> ?? {}), orderIndex: i },
        } as any);
      }
    }
  };

  const handleMoveTextBlock = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sceneContent.length) return;

    const updated = [...sceneContent];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setSceneContent(updated);
    handleSaveScene(updated);
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
                  {ch.status === 'published' ? (
                    <Chip
                      icon={<CheckCircleOutlineIcon />}
                      label="Publicado"
                      size="small"
                      color="success"
                      variant="outlined"
                      sx={{ mr: 0.5 }}
                    />
                  ) : (
                    <IconButton
                      size="small"
                      title="Publicar capítulo"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePublishChapter(ch.id);
                      }}
                    >
                      <PublishIcon fontSize="small" />
                    </IconButton>
                  )}
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
              {scenes.map((sc, i) => (
                <ListItemButton
                  key={sc.id}
                  selected={selectedSceneId === sc.id}
                  onClick={() => setSelectedSceneId(sc.id)}
                  sx={{ display: 'flex', gap: 0.5 }}
                >
                  <Box display="flex" flexDirection="column" alignItems="center" mr={0.5}>
                    <IconButton
                      size="small"
                      disabled={i === 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReorderScene(i, 'up');
                      }}
                      sx={{ py: 0, minWidth: 20, minHeight: 16 }}
                    >
                      <ArrowUpwardIcon fontSize="inherit" />
                    </IconButton>
                    <IconButton
                      size="small"
                      disabled={i === scenes.length - 1}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReorderScene(i, 'down');
                      }}
                      sx={{ py: 0, minWidth: 20, minHeight: 16 }}
                    >
                      <ArrowDownwardIcon fontSize="inherit" />
                    </IconButton>
                  </Box>
                  <ListItemText
                    primary={sc.title}
                    secondary={`${sc.content?.length ?? 0} blocos · ${(sc as any)?.choices?.length ?? 0} escolhas`}
                    sx={{ flex: '1 1 auto' }}
                  />
                  <Chip label={sc.type} size="small" variant="outlined" />
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteScene(sc.id);
                    }}
                    disabled={loading}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
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
                <Box mt={2} display="flex" gap={1}>
                  <Button variant="contained" onClick={() => handleSaveScene()} disabled={loading}>
                    {loading ? 'Salvando...' : 'Salvar Cena'}
                  </Button>
                </Box>
              </Paper>

              {/* Text blocks */}
              <Paper sx={{ p: 3 }}>
                <Typography variant="subtitle1" mb={2}>
                  Blocos de Texto
                </Typography>
                {sceneContent.map((block, i) => {
                  const isEditing = editingBlockIndex === i;
                  return (
                    <Box
                      key={i}
                      sx={{
                        mb: 2,
                        p: 2,
                        bgcolor: isEditing ? 'rgba(25, 118, 210, 0.08)' : 'rgba(255,255,255,0.03)',
                        borderRadius: 1,
                        position: 'relative',
                        border: isEditing ? '1px solid rgba(25, 118, 210, 0.3)' : '1px solid transparent',
                        cursor: isEditing ? 'default' : 'pointer',
                        transition: 'all 0.15s ease',
                        '&:hover': isEditing
                          ? {}
                          : { bgcolor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.1)' },
                      }}
                      onClick={() => !isEditing && startEditingBlock(i)}
                    >
                      {isEditing ? (
                        /* ── Edit mode ── */
                        <Box display="flex" flexDirection="column" gap={1.5}>
                          <Box display="flex" gap={1} alignItems="center">
                            <FormControl size="small" sx={{ minWidth: 130 }}>
                              <Select
                                value={editingBlockType}
                                onChange={(e) => setEditingBlockType(e.target.value as any)}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MenuItem value="narration">Narração</MenuItem>
                                <MenuItem value="dialogue">Diálogo</MenuItem>
                                <MenuItem value="thought">Pensamento</MenuItem>
                              </Select>
                            </FormControl>
                            {editingBlockType === 'dialogue' && (
                              <TextField
                                size="small"
                                label="Personagem"
                                value={editingBlockSpeaker}
                                onChange={(e) => setEditingBlockSpeaker(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                sx={{ width: 150 }}
                              />
                            )}
                          </Box>
                          <TextField
                            size="small"
                            fullWidth
                            multiline
                            minRows={2}
                            value={editingBlockText}
                            onChange={(e) => setEditingBlockText(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                e.preventDefault();
                                handleUpdateTextBlock();
                              }
                              if (e.key === 'Escape') cancelEditingBlock();
                            }}
                            autoFocus
                          />
                          <Box display="flex" gap={1} justifyContent="flex-end">
                            <Button size="small" onClick={(e) => { e.stopPropagation(); cancelEditingBlock(); }}>
                              Cancelar
                            </Button>
                            <Button size="small" variant="contained" onClick={(e) => { e.stopPropagation(); handleUpdateTextBlock(); }}>
                              Salvar
                            </Button>
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            Ctrl+Enter para salvar · Esc para cancelar
                          </Typography>
                        </Box>
                      ) : (
                        /* ── Display mode ── */
                        <>
                          <Box display="flex" gap={1} mb={1} alignItems="center">
                            <Box display="flex" gap={0.5} mr={1}>
                              <IconButton
                                size="small"
                                disabled={i === 0}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveTextBlock(i, 'up');
                                }}
                                sx={{ py: 0, minWidth: 20, minHeight: 16 }}
                              >
                                <ArrowUpwardIcon fontSize="inherit" />
                              </IconButton>
                              <IconButton
                                size="small"
                                disabled={i === sceneContent.length - 1}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveTextBlock(i, 'down');
                                }}
                                sx={{ py: 0, minWidth: 20, minHeight: 16 }}
                              >
                                <ArrowDownwardIcon fontSize="inherit" />
                              </IconButton>
                            </Box>
                            <Chip label={block.type} size="small" color="primary" variant="outlined" />
                            {block.speaker && <Chip label={block.speaker} size="small" />}
                          </Box>
                          <Typography variant="body2" sx={{ ml: 4 }}>{block.text}</Typography>
                          <IconButton
                            size="small"
                            sx={{ position: 'absolute', top: 4, right: 4 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveTextBlock(i);
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </>
                      )}
                    </Box>
                  );
                })}

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
                {choices.map((ch) => {
                  const targetScene = scenes.find((s) => s.id === ch.targetSceneId);
                  const isEditing = editingChoiceId === ch.id;
                  return (
                    <Box
                      key={ch.id}
                      display="flex"
                      gap={1}
                      alignItems="center"
                      mb={1}
                      sx={{
                        p: isEditing ? 1.5 : 0,
                        bgcolor: isEditing ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                        borderRadius: 1,
                        border: isEditing ? '1px solid rgba(25, 118, 210, 0.3)' : '1px solid transparent',
                      }}
                    >
                      {isEditing ? (
                        <>
                          <Box flex={1} display="flex" flexDirection="column" gap={1}>
                            <TextField
                              size="small"
                              label="Texto da escolha"
                              value={editingChoiceText}
                              onChange={(e) => setEditingChoiceText(e.target.value)}
                              fullWidth
                              autoFocus
                            />
                            <FormControl size="small" fullWidth>
                              <InputLabel>Cena alvo</InputLabel>
                              <Select
                                value={editingChoiceTarget}
                                onChange={(e) => setEditingChoiceTarget(e.target.value)}
                                label="Cena alvo"
                              >
                                {scenes
                                  .filter((s) => s.id !== selectedSceneId)
                                  .map((s) => (
                                    <MenuItem key={s.id} value={s.id}>
                                      {s.title}
                                    </MenuItem>
                                  ))}
                              </Select>
                            </FormControl>
                            <Box display="flex" gap={1} justifyContent="flex-end">
                              <Button size="small" onClick={cancelEditingChoice}>
                                Cancelar
                              </Button>
                              <Button size="small" variant="contained" onClick={handleUpdateChoice}>
                                Salvar
                              </Button>
                            </Box>
                          </Box>
                        </>
                      ) : (
                        <>
                          <Chip
                            label={`→ ${targetScene?.title ?? ch.targetSceneId?.slice(0, 8) + '...'}`}
                            size="small"
                            variant="outlined"
                            color={targetScene ? 'primary' : 'default'}
                            sx={{ cursor: 'pointer' }}
                            onClick={() => startEditingChoice(ch)}
                          />
                          <Typography
                            variant="body2"
                            sx={{ flex: 1, cursor: 'pointer' }}
                            onClick={() => startEditingChoice(ch)}
                          >
                            {ch.text}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteChoice(ch.id)}
                            disabled={loading}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </>
                      )}
                    </Box>
                  );
                })}
                <Box display="flex" gap={1} mt={2}>
                  <TextField
                    size="small"
                    label="Texto da escolha"
                    value={newChoiceText}
                    onChange={(e) => setNewChoiceText(e.target.value)}
                    sx={{ flex: 1 }}
                  />
                  <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>Cena alvo</InputLabel>
                    <Select
                      value={newChoiceTarget}
                      onChange={(e) => setNewChoiceTarget(e.target.value)}
                      label="Cena alvo"
                    >
                      {scenes
                        .filter((s) => s.id !== selectedSceneId)
                        .map((s) => (
                          <MenuItem key={s.id} value={s.id}>
                            {s.title}
                          </MenuItem>
                        ))}
                      {scenes.filter((s) => s.id !== selectedSceneId).length === 0 && (
                        <MenuItem disabled value="">
                          Nenhuma outra cena disponível
                        </MenuItem>
                      )}
                    </Select>
                  </FormControl>
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
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6">
              Preview — {selectedScene.title}
            </Typography>
            <Button
              variant="contained"
              startIcon={<PlayArrowIcon />}
              onClick={() => window.open(`/play/${vnId}`, '_blank')}
              size="small"
            >
              Abrir no Player
            </Button>
          </Box>
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

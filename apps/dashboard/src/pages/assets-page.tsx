import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type DragEvent,
  type ChangeEvent,
} from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
  FormControl,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Tooltip,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ImageIcon from '@mui/icons-material/Image';
import AudiotrackIcon from '@mui/icons-material/Audiotrack';
import VideocamIcon from '@mui/icons-material/Videocam';
import type { Asset } from '@zan-vn/shared';
import { useAuth } from '../providers/auth-provider.js';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPE_PREFIXES = ['image/', 'audio/', 'video/'];

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function getTypeIcon(type: Asset['type']) {
  switch (type) {
    case 'image':
      return <ImageIcon />;
    case 'audio':
      return <AudiotrackIcon />;
    case 'video':
      return <VideocamIcon />;
  }
}

function getTypeLabel(type: Asset['type']): string {
  switch (type) {
    case 'image':
      return 'Imagem';
    case 'audio':
      return 'Áudio';
    case 'video':
      return 'Vídeo';
  }
}

export function AssetsPage() {
  const { api } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Asset | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const typeParam = filterType !== 'all' ? filterType : undefined;
      const res = await api.getAssets(typeParam);
      if (res.success && res.data) {
        setAssets(res.data as Asset[]);
      } else {
        setError(res.error?.message ?? 'Erro ao carregar assets.');
      }
    } catch {
      setError('Erro ao carregar assets.');
    } finally {
      setLoading(false);
    }
  }, [api, filterType]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `"${file.name}" excede o limite de 50MB.`;
    }
    if (!ALLOWED_TYPE_PREFIXES.some((prefix) => file.type.startsWith(prefix))) {
      return `"${file.name}" não é um tipo suportado (imagem, áudio ou vídeo).`;
    }
    return null;
  };

  const uploadFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f): f is File => f !== undefined);
    if (fileArray.length === 0) return;

    // Validate all files first
    const errors: string[] = [];
    for (const f of fileArray) {
      const err = validateFile(f);
      if (err) errors.push(err);
    }
    if (errors.length > 0) {
      setSnackbar(errors.join(' '));
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    let completedCount = 0;
    for (const file of fileArray) {
      const res = await api.uploadAsset(file, (pct) => {
        setUploadProgress(Math.round(((completedCount * 100) + pct) / fileArray.length));
      });

      if (!res.success) {
        setSnackbar(`Erro ao enviar "${file.name}": ${res.error?.message ?? 'Erro desconhecido'}`);
      }
      completedCount++;
    }

    setUploading(false);
    setUploadProgress(0);
    fetchAssets();
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      uploadFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) {
      uploadFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDeleteClick = (asset: Asset) => {
    setDeleteTarget(asset);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const res = await api.deleteAsset(deleteTarget.id);
    if (res.success) {
      setSnackbar('Asset removido com sucesso.');
      fetchAssets();
    } else {
      setSnackbar(res.error?.message ?? 'Erro ao remover asset.');
    }
    setDeleteTarget(null);
  };

  const handlePreview = (asset: Asset) => {
    setPreviewAsset(asset);
  };

  const copyAssetUrl = (asset: Asset) => {
    const url = asset.storageUrl;
    navigator.clipboard.writeText(url).then(() => {
      setSnackbar('URL copiada!');
    });
  };

  const sortedAssets =
    sortBy === 'name'
      ? [...assets].sort((a, b) => a.originalName.localeCompare(b.originalName))
      : assets;

  return (
    <Box>
      <Typography variant="h3" mb={4}>
        Assets
      </Typography>

      {/* Upload Zone */}
      <Box
        className={`upload-zone${dragOver ? ' upload-zone--dragover' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        mb={4}
      >
        <input
          ref={fileInputRef}
          type="file"
          hidden
          multiple
          accept="image/*,audio/*,video/*"
          onChange={handleFileSelect}
        />
        {uploading ? (
          <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
            <CircularProgress variant="determinate" value={uploadProgress} size={48} />
            <Typography variant="body2" color="text.secondary">
              Enviando... {uploadProgress}%
            </Typography>
          </Box>
        ) : (
          <>
            <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
            <Typography variant="body1" fontWeight={500}>
              Arraste arquivos aqui ou clique para upload
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Imagens, áudio e vídeo — até 50MB por arquivo
            </Typography>
          </>
        )}
      </Box>

      {/* Filter Bar */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
        flexWrap="wrap"
        gap={2}
      >
        <ToggleButtonGroup
          value={filterType}
          exclusive
          onChange={(_, val) => val && setFilterType(val)}
          size="small"
        >
          <ToggleButton value="all">Todos</ToggleButton>
          <ToggleButton value="image">Imagens</ToggleButton>
          <ToggleButton value="audio">Áudio</ToggleButton>
          <ToggleButton value="video">Vídeo</ToggleButton>
        </ToggleButtonGroup>

        <FormControl size="small" sx={{ minWidth: 180 }}>
          <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} displayEmpty>
            <MenuItem value="recent">Mais recentes</MenuItem>
            <MenuItem value="name">Nome A-Z</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Loading */}
      {loading ? (
        <Grid container spacing={3} aria-busy="true">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <Box
                sx={{
                  height: 220,
                  bgcolor: 'rgba(124,77,255,0.08)',
                  borderRadius: 2,
                }}
              />
            </Grid>
          ))}
        </Grid>
      ) : assets.length === 0 ? (
        /* Empty State */
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          py={8}
          gap={2}
        >
          <CloudUploadIcon sx={{ fontSize: 80, color: 'text.disabled' }} />
          <Typography variant="h5" color="text.secondary">
            Nenhum asset ainda
          </Typography>
          <Typography variant="body1" color="text.disabled">
            Faça upload para começar.
          </Typography>
        </Box>
      ) : (
        /* Asset Grid */
        <Box className="assets-grid">
          {sortedAssets.map((asset) => (
            <Box key={asset.id} className="asset-card">
              {/* Thumbnail */}
              <Box className="asset-card__thumbnail" onClick={() => handlePreview(asset)}>
                {asset.type === 'image' && asset.storageUrl ? (
                  <img
                    src={asset.storageUrl}
                    alt={asset.originalName}
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    height="100%"
                    color="text.disabled"
                  >
                    {getTypeIcon(asset.type)}
                  </Box>
                )}
              </Box>

              {/* Info */}
              <Box p={1.5}>
                <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                  <Chip
                    label={getTypeLabel(asset.type)}
                    size="small"
                    color={
                      asset.type === 'image'
                        ? 'primary'
                        : asset.type === 'audio'
                          ? 'secondary'
                          : 'default'
                    }
                    variant="outlined"
                  />
                </Box>
                <Tooltip title={asset.originalName}>
                  <Typography
                    variant="body2"
                    fontWeight={500}
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {asset.originalName}
                  </Typography>
                </Tooltip>
                <Typography variant="caption" color="text.secondary">
                  {formatSize(asset.sizeBytes)} • {formatDate(asset.createdAt)}
                </Typography>
                <Box display="flex" gap={0.5} mt={0.5}>
                  <IconButton
                    size="small"
                    onClick={() => handlePreview(asset)}
                    aria-label="Visualizar"
                  >
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => copyAssetUrl(asset)}
                    aria-label="Copiar URL"
                  >
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteClick(asset)}
                    aria-label="Remover"
                    color="error"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {/* Preview Modal */}
      <Dialog
        open={!!previewAsset}
        onClose={() => setPreviewAsset(null)}
        maxWidth="md"
        fullWidth
      >
        {previewAsset && (
          <>
            <DialogTitle>{previewAsset.originalName}</DialogTitle>
            <DialogContent>
              {previewAsset.type === 'image' ? (
                <Box
                  component="img"
                  src={previewAsset.storageUrl}
                  alt={previewAsset.originalName}
                  sx={{
                    width: '100%',
                    maxHeight: '70vh',
                    objectFit: 'contain',
                    borderRadius: 1,
                  }}
                />
              ) : previewAsset.type === 'audio' ? (
                <Box component="audio" controls sx={{ width: '100%', mt: 2 }}>
                  <source
                    src={previewAsset.storageUrl}
                    type={previewAsset.mimeType}
                  />
                </Box>
              ) : (
                <Box
                  component="video"
                  controls
                  sx={{ width: '100%', maxHeight: '70vh', borderRadius: 1 }}
                >
                  <source
                    src={previewAsset.storageUrl}
                    type={previewAsset.mimeType}
                  />
                </Box>
              )}
              <Box mt={2} display="flex" gap={1} flexWrap="wrap">
                <Chip
                  label={getTypeLabel(previewAsset.type)}
                  size="small"
                  variant="outlined"
                />
                <Chip
                  label={formatSize(previewAsset.sizeBytes)}
                  size="small"
                  variant="outlined"
                />
                {previewAsset.width && previewAsset.height && (
                  <Chip
                    label={`${previewAsset.width}×${previewAsset.height}`}
                    size="small"
                    variant="outlined"
                  />
                )}
                {previewAsset.durationSeconds != null && (
                  <Chip
                    label={`${previewAsset.durationSeconds}s`}
                    size="small"
                    variant="outlined"
                  />
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button
                startIcon={<ContentCopyIcon />}
                onClick={() => copyAssetUrl(previewAsset)}
              >
                Copiar URL
              </Button>
              <Button onClick={() => setPreviewAsset(null)}>Fechar</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Remover asset</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja remover{' '}
            <strong>{deleteTarget?.originalName}</strong>? Esta ação não pode ser
            desfeita.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancelar</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Remover
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={!!snackbar}
        autoHideDuration={4000}
        onClose={() => setSnackbar(null)}
        message={snackbar ?? ''}
      />
    </Box>
  );
}

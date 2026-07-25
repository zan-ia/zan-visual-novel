import { Box, Typography, TextField, Button, Paper } from '@mui/material';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../providers/auth-provider.js';

export function VNEditorPage() {
  const { vnId } = useParams<{ vnId: string }>();
  const { api } = useAuth();
  const navigate = useNavigate();
  const isNew = vnId === 'new';
  const [title, setTitle] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isNew && vnId) {
      api.getVN(vnId).then((res) => {
        if (res.success && res.data) {
          const vn = res.data as any;
          setTitle(vn.title ?? '');
          setSynopsis(vn.synopsis ?? '');
        }
      });
    }
  }, [vnId, isNew]);

  const handleSave = async () => {
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
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box maxWidth={800} mx="auto">
      <Typography variant="h3" mb={4}>
        {isNew ? 'Nova Visual Novel' : 'Editar Visual Novel'}
      </Typography>
      <Paper sx={{ p: 4 }}>
        <TextField fullWidth label="Título" value={title}
          onChange={(e) => setTitle(e.target.value)} margin="normal" required />
        <TextField fullWidth label="Sinopse" value={synopsis}
          onChange={(e) => setSynopsis(e.target.value)} margin="normal"
          multiline rows={4} required />
        <Box mt={3} display="flex" gap={2}>
          <Button variant="contained" onClick={handleSave} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
          <Button variant="outlined" onClick={() => navigate('/studio')}>
            Cancelar
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

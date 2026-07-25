import { Outlet, useNavigate } from 'react-router-dom';
import {
  AppBar, Toolbar, Typography, Button, Container, Box,
  Drawer, List, ListItemButton, ListItemIcon, ListItemText,
} from '@mui/material';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import BarChartIcon from '@mui/icons-material/BarChart';
import { useAuth } from '../providers/auth-provider.js';

const DRAWER_WIDTH = 240;

export function StudioLayout() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <Box sx={{ display: 'flex', minHeight: '100dvh' }}>
      <AppBar position="fixed" color="transparent" elevation={0}
        sx={{ backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.05)', zIndex: 1201 }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontFamily: '"Playfair Display", serif', cursor: 'pointer' }}
            onClick={() => navigate('/studio')}>
            Creator Studio
          </Typography>
          {isAuthenticated ? (
            <>
              <Typography variant="body2" sx={{ mr: 2, color: 'text.secondary' }}>
                {user?.displayName}
              </Typography>
              <Button color="inherit" onClick={logout}>Sair</Button>
            </>
          ) : (
            <Button color="inherit" onClick={() => navigate('/login')}>Entrar</Button>
          )}
        </Toolbar>
      </AppBar>

      <Drawer variant="permanent" sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box', borderRight: '1px solid rgba(255,255,255,0.05)' },
      }}>
        <Toolbar />
        <List sx={{ mt: 2 }}>
          <ListItemButton onClick={() => navigate('/studio')}>
            <ListItemIcon><MenuBookIcon /></ListItemIcon>
            <ListItemText primary="Minhas VNs" />
          </ListItemButton>
          <ListItemButton onClick={() => navigate('/analytics')}>
            <ListItemIcon><BarChartIcon /></ListItemIcon>
            <ListItemText primary="Analytics" />
          </ListItemButton>
        </List>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}

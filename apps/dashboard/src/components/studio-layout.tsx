import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import BarChartIcon from '@mui/icons-material/BarChart';
import FolderIcon from '@mui/icons-material/Folder';
import MenuIcon from '@mui/icons-material/Menu';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { useAuth } from '../providers/auth-provider.js';

const DRAWER_WIDTH = 240;

export function StudioLayout() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const drawerContent = (
    <>
      <Toolbar />
      <List sx={{ mt: 2 }}>
        <ListItemButton
          selected={location.pathname === '/studio'}
          onClick={() => {
            navigate('/studio');
            setMobileOpen(false);
          }}
        >
          <ListItemIcon>
            <MenuBookIcon />
          </ListItemIcon>
          <ListItemText primary="Minhas VNs" />
        </ListItemButton>
        <ListItemButton
          selected={location.pathname === '/assets'}
          onClick={() => {
            navigate('/assets');
            setMobileOpen(false);
          }}
        >
          <ListItemIcon>
            <FolderIcon />
          </ListItemIcon>
          <ListItemText primary="Assets" />
        </ListItemButton>
        <ListItemButton
          selected={location.pathname === '/analytics'}
          onClick={() => {
            navigate('/analytics');
            setMobileOpen(false);
          }}
        >
          <ListItemIcon>
            <BarChartIcon />
          </ListItemIcon>
          <ListItemText primary="Analytics" />
        </ListItemButton>

        {user?.role === 'admin' && (
          <>
            <Box sx={{ px: 2, mt: 2 }}>
              <Typography
                variant="caption"
                sx={{ color: 'text.secondary', textTransform: 'uppercase', fontWeight: 700 }}
              >
                Admin
              </Typography>
            </Box>
            <ListItemButton
              selected={location.pathname.startsWith('/admin')}
              onClick={() => {
                navigate('/admin/users');
                setMobileOpen(false);
              }}
            >
              <ListItemIcon>
                <AdminPanelSettingsIcon />
              </ListItemIcon>
              <ListItemText primary="Usuários" />
            </ListItemButton>
            <ListItemButton
              selected={location.pathname.startsWith('/admin')}
              onClick={() => {
                navigate('/admin/moderation');
                setMobileOpen(false);
              }}
            >
              <ListItemIcon>
                <AdminPanelSettingsIcon />
              </ListItemIcon>
              <ListItemText primary="Moderação" />
            </ListItemButton>
            <ListItemButton
              selected={location.pathname.startsWith('/admin')}
              onClick={() => {
                navigate('/admin/credits');
                setMobileOpen(false);
              }}
            >
              <ListItemIcon>
                <AdminPanelSettingsIcon />
              </ListItemIcon>
              <ListItemText primary="Créditos" />
            </ListItemButton>
          </>
        )}
      </List>
    </>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100dvh' }}>
      <AppBar
        position="fixed"
        color="transparent"
        elevation={0}
        sx={{
          background: 'rgba(15, 15, 35, 0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          zIndex: 1201,
        }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton
              edge="start"
              color="inherit"
              aria-label="Abrir menu"
              onClick={() => setMobileOpen(!mobileOpen)}
              sx={{ mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography
            variant="h6"
            sx={{ flexGrow: 1, fontFamily: '"Playfair Display", serif', cursor: 'pointer' }}
            onClick={() => navigate('/studio')}
          >
            Zan VN
          </Typography>
          {isAuthenticated ? (
            <>
              <Typography variant="body2" sx={{ mr: 2, color: 'text.secondary' }}>
                {user?.displayName}
              </Typography>
              <Button color="inherit" onClick={logout}>
                Sair
              </Button>
            </>
          ) : (
            <Button variant="outlined" color="inherit" onClick={() => navigate('/login')}>
              Entrar
            </Button>
          )}
        </Toolbar>
      </AppBar>

      {isMobile ? (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              borderRight: '1px solid rgba(255,255,255,0.05)',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      ) : (
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              borderRight: '1px solid rgba(255,255,255,0.05)',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}

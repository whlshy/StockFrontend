import React from 'react'
import { Box, Divider, Drawer, Backdrop, Toolbar, List, useMediaQuery } from '@mui/material'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import useAppStore from '../../store/app'
import { Home, Folder } from '@mui/icons-material';
import ListItem from '../ui/ListItem'

const drawerWidth = 240;

const drawer = [
  { text: "首頁", path: '/', icon: <Home /> },
  { text: "選股", path: '/folder', icon: <Folder /> },
]

function index() {
  const { isSidebarOpen, setSidebarOpen } = useAppStore(state => state)
  let location = useLocation()
  let navigate = useNavigate()
  const matches = useMediaQuery('(min-width:900px)')

  return (
    <Box
      component="nav"
      sx={{ flexShrink: { md: 0 }, width: !!matches && isSidebarOpen ? drawerWidth : 0 }}
    >
      <Backdrop
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.drawer - 1,
          display: { md: 'none', xs: 'block' }
        }}
        open={!matches && !!isSidebarOpen}
        onClick={() => setSidebarOpen()}
      ></Backdrop>
      <Drawer
        variant={!matches ? "temporary" : "persistent"}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
        }}
        open={isSidebarOpen}
        anchor='left'
        hideBackdrop={true}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {
              drawer.map(({ text, path, icon }, index) => (
                <ListItem
                  key={path}
                  component={Link}
                  to={path}
                  className="reset-link"
                  onClick={e => (!matches && setSidebarOpen(false))}
                  selected={!!location.pathname.match(new RegExp(path + '($|/)'))}
                  icon={icon}
                  text={text}
                />
              ))
            }
          </List>
        </Box>
      </Drawer>
    </Box>
  )
}

export default index
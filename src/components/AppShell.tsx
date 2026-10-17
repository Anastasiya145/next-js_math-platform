"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  AppBar,
  Avatar,
  Alert,
  Button,
  Box,
  Container,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Snackbar,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import AssignmentIcon from "@mui/icons-material/AssignmentOutlined";
import CalendarIcon from "@mui/icons-material/CalendarMonthOutlined";
import DashboardIcon from "@mui/icons-material/DashboardOutlined";
import MenuBookIcon from "@mui/icons-material/MenuBookOutlined";
import MenuIcon from "@mui/icons-material/Menu";
import PeopleIcon from "@mui/icons-material/PeopleOutlined";
import { navItems, router } from "@/app/router";
import { ChangePasswordDialog } from "./ChangePasswordDialog";
import { DriveStatusAlert } from "./DriveStatusAlert";
import { glass, glow, gradientOf, shade, tint, type Tone } from "./tones";
import { useAppLanguage } from "@/lib/LanguageProvider";
import { SiteLogo } from "./SiteLogo";

const DRAWER_WIDTH = 256;
const NAV: Record<string, { icon: ReactNode; tone: Tone }> = {
  [router.home]: { icon: <DashboardIcon />, tone: "primary" },
  [router.students]: { icon: <PeopleIcon />, tone: "info" },
  [router.schedule]: { icon: <CalendarIcon />, tone: "secondary" },
  [router.homework]: { icon: <AssignmentIcon />, tone: "warning" },
  [router.materials]: { icon: <MenuBookIcon />, tone: "success" },
};

const HERO_GRADIENT = `linear-gradient(120deg, ${shade("primary")}, color-mix(in srgb, ${shade("primary")} 45%, ${shade("secondary")}))`;
const white = shade("primary", "contrastText");

type AppShellProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function AppShell({
  title,
  subtitle,
  actions,
  children,
}: AppShellProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const {
    locale,
    t,
    switchLanguage,
    switching,
    switchError,
    clearSwitchError,
  } = useAppLanguage();
  const isStudent = session?.user.role === "student";
  const isLanguageStudent = isStudent && session?.user.siteType === "languages";
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [passwordOpen, setPasswordOpen] = useState(false);

  const nav = (
    <List sx={{ px: 1.5, py: 2 }}>
      {navItems.map(({ href, label }) => {
        const { icon, tone } = NAV[href];
        const selected =
          href === router.home ? pathname === href : pathname.startsWith(href);
        return (
          <ListItemButton
            key={href}
            component={Link}
            href={href}
            selected={selected}
            onClick={() => setDrawerOpen(false)}
            sx={{
              borderRadius: "14px",
              mb: 0.75,
              gap: 1.5,
              py: 1,
              "&:hover": { bgcolor: tint(tone, 10) },
              "&.Mui-selected, &.Mui-selected:hover": {
                color: shade(tone, "contrastText"),
                background: gradientOf(tone),
                boxShadow: glow(tone, 70),
              },
            }}
          >
            <Avatar
              variant="rounded"
              sx={{
                width: 36,
                height: 36,
                bgcolor: selected ? glass(24) : tint(tone, 16),
                color: selected ? "inherit" : shade(tone),
              }}
            >
              {icon}
            </Avatar>
            <ListItemText
              primary={label}
              slotProps={{ primary: { sx: { fontWeight: 600 } } }}
            />
          </ListItemButton>
        );
      })}
    </List>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor:
            "color-mix(in srgb, var(--mui-palette-background-paper) 80%, transparent)",
          backdropFilter: "blur(14px)",
          borderBottom: `1px solid ${tint("primary", 16)}`,
        }}
      >
        <Toolbar>
          {!isStudent && (
            <IconButton
              edge="start"
              aria-label="Відкрити меню"
              onClick={() => setDrawerOpen(true)}
              sx={{ mr: 1, display: { md: "none" } }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <SiteLogo size="header" sx={{ flexGrow: 1, minWidth: 0, mr: 1.5 }} />
          {isLanguageStudent && (
            <Tooltip
              title={locale === "fr" ? t("switchToRu") : t("switchToFr")}
            >
              <Button
                size="small"
                variant="outlined"
                aria-label={locale === "fr" ? t("switchToRu") : t("switchToFr")}
                disabled={switching}
                onClick={() => void switchLanguage()}
                sx={{ minWidth: 44, px: 1, mr: 0.5 }}
              >
                {locale === "fr" ? "RU" : "FR"}
              </Button>
            </Tooltip>
          )}
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mr: 1, display: { xs: "none", sm: "block" } }}
          >
            {session?.user.name}
          </Typography>
          <IconButton
            aria-label={isLanguageStudent ? t("profile") : "Профіль"}
            onClick={(event) => setMenuAnchor(event.currentTarget)}
          >
            <Avatar
              sx={{
                width: 36,
                height: 36,
                background: gradientOf("secondary"),
                boxShadow: glow("secondary", 70),
              }}
            >
              {session?.user.name?.charAt(0).toUpperCase() ?? "А"}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={() => setMenuAnchor(null)}
          >
            {isStudent && (
              <MenuItem
                onClick={() => {
                  setMenuAnchor(null);
                  setPasswordOpen(true);
                }}
              >
                {t("changePassword")}
              </MenuItem>
            )}
            <MenuItem onClick={() => signOut({ redirectTo: router.login })}>
              {t("logout")}
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {!isStudent && (
        <>
          <Drawer
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            sx={{
              display: { md: "none" },
              "& .MuiDrawer-paper": { width: DRAWER_WIDTH },
            }}
          >
            <Toolbar />
            {nav}
          </Drawer>
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: "none", md: "block" },
              width: DRAWER_WIDTH,
              flexShrink: 0,
              "& .MuiDrawer-paper": {
                width: DRAWER_WIDTH,
                boxSizing: "border-box",
                borderRight: `1px solid ${tint("primary", 14)}`,
                backgroundColor:
                  "color-mix(in srgb, var(--mui-palette-background-paper) 70%, transparent)",
                backdropFilter: "blur(14px)",
              },
            }}
          >
            <Toolbar />
            {nav}
          </Drawer>
        </>
      )}

      <Box component="main" sx={{ flexGrow: 1, minWidth: 0 }}>
        <Toolbar />
        <Container maxWidth="lg" sx={{ py: 3 }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{
              mb: 3,
              alignItems: { sm: "center" },
              justifyContent: "space-between",
              ...(isStudent
                ? { py: 1 }
                : {
                    p: { xs: 2.5, md: 3.5 },
                    position: "relative",
                    overflow: "hidden",
                    borderRadius: "24px",
                    color: white,
                    background: HERO_GRADIENT,
                    boxShadow: glow("primary", 75),
                    "&::before, &::after": {
                      content: '""',
                      position: "absolute",
                      borderRadius: "50%",
                    },
                    "&::before": {
                      width: 280,
                      height: 280,
                      top: -130,
                      right: -60,
                      background: glass(14),
                    },
                    "&::after": {
                      width: 160,
                      height: 160,
                      bottom: -90,
                      right: 190,
                      background: glass(10),
                    },
                    "& > *": { position: "relative" },
                    "& .MuiButton-contained, & .MuiButton-contained:hover": {
                      color: shade("primary"),
                      background: white,
                      boxShadow: "none",
                      filter: "none",
                    },
                    "& .MuiButton-contained.Mui-disabled": {
                      color: glass(75),
                      background: glass(28),
                    },
                    "& .MuiButton-text, & .MuiButton-outlined": {
                      color: "inherit",
                      borderColor: glass(55),
                    },
                  }),
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h4" component="h1">
                {title}
              </Typography>
              {subtitle && (
                <Typography
                  sx={{ mt: 0.5, opacity: isStudent ? 1 : 0.9 }}
                  color={isStudent ? "text.secondary" : "inherit"}
                >
                  {subtitle}
                </Typography>
              )}
            </Box>
            {actions}
          </Stack>
          {session?.user.role === "teacher" && <DriveStatusAlert />}
          {children}
        </Container>
      </Box>
      {passwordOpen && (
        <ChangePasswordDialog onClose={() => setPasswordOpen(false)} />
      )}
      <Snackbar
        open={Boolean(switchError)}
        autoHideDuration={5000}
        onClose={clearSwitchError}
      >
        <Alert severity="error" onClose={clearSwitchError}>
          {switchError}
        </Alert>
      </Snackbar>
    </Box>
  );
}

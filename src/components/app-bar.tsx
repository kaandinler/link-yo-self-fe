"use client";
import { useState } from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Menu from "@mui/material/Menu";
import MenuIcon from "@mui/icons-material/Menu";
import Container from "@mui/material/Container";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import MenuItem from "@mui/material/MenuItem";
import useAuth from "@/services/auth/use-auth";
import useAuthActions from "@/services/auth/use-auth-actions";
import CircularProgress from "@mui/material/CircularProgress";
import { useTranslation } from "@/services/i18n/client";
import Link from "@/components/link";
import { RoleEnum } from "@/services/api/types/role";
import Divider from "@mui/material/Divider";
import ThemeSwitchButton from "@/components/switch-theme-button";
import { IS_SIGN_UP_ENABLED } from "@/services/auth/config";
import { styled } from "@mui/material/styles";

// Özel stillendirilmiş AppBar bileşeni
const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: "#111518",
  borderBottom: "1px solid #283139",
  boxShadow: "none",
}));

// Logo SVG bileşeni
const LogoIcon = () => (
  <svg
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
  >
    <path
      d="M36.7273 44C33.9891 44 31.6043 39.8386 30.3636 33.69C29.123 39.8386 26.7382 44 24 44C21.2618 44 18.877 39.8386 17.6364 33.69C16.3957 39.8386 14.0109 44 11.2727 44C7.25611 44 4 35.0457 4 24C4 12.9543 7.25611 4 11.2727 4C14.0109 4 16.3957 8.16144 17.6364 14.31C18.877 8.16144 21.2618 4 24 4C26.7382 4 29.123 8.16144 30.3636 14.31C31.6043 8.16144 33.9891 4 36.7273 4C40.7439 4 44 12.9543 44 24C44 35.0457 40.7439 44 36.7273 44Z"
      fill="currentColor"
    />
  </svg>
);

function ResponsiveAppBar() {
  const { t } = useTranslation("common");
  const { user, isLoaded } = useAuth();
  const { logOut } = useAuthActions();
  const [anchorElementNav, setAnchorElementNav] = useState<null | HTMLElement>(
    null
  );
  const [anchorElementUser, setAnchorElementUser] =
    useState<null | HTMLElement>(null);

  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElementNav(event.currentTarget);
  };
  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElementUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElementNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElementUser(null);
  };

  return (
    <StyledAppBar position="sticky">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          {" "}
          {/* Logo ve Başlık - Desktop */}
          <Box
            sx={{
              display: { xs: "none", md: "flex" },
              alignItems: "center",
              gap: 2,
            }}
          >
            <LogoIcon />
            <Typography
              variant="h6"
              noWrap
              component={Link}
              href="/"
              sx={{
                fontWeight: 700,
                letterSpacing: "-0.015em",
                color: "inherit",
                textDecoration: "none",
                fontFamily: '"Plus Jakarta Sans", "Noto Sans", sans-serif',
              }}
            >
              LinkYoSelf
            </Typography>
          </Box>
          {/* Mobil Menü Ikonu */}
          <Box sx={{ flexGrow: 1, display: { xs: "flex", md: "none" } }}>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleOpenNavMenu}
              color="inherit"
              sx={{ padding: "8px" }}
            >
              <MenuIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorElementNav}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "left",
              }}
              keepMounted
              transformOrigin={{
                vertical: "top",
                horizontal: "left",
              }}
              open={Boolean(anchorElementNav)}
              onClose={handleCloseNavMenu}
              sx={{
                display: { xs: "block", md: "none" },
                "& .MuiPaper-root": {
                  backgroundColor: "#1c2127",
                  borderRadius: "6px",
                  border: "1px solid #283139",
                },
              }}
            >
              {" "}
              <MenuItem
                onClick={handleCloseNavMenu}
                component={Link}
                href="/"
                sx={{
                  "&:hover": {
                    backgroundColor: "#283139",
                  },
                }}
              >
                <Typography textAlign="center">Home</Typography>
              </MenuItem>
              <MenuItem
                onClick={handleCloseNavMenu}
                component={Link}
                href="/about"
                sx={{
                  "&:hover": {
                    backgroundColor: "#283139",
                  },
                }}
              >
                <Typography textAlign="center">About</Typography>
              </MenuItem>
              <MenuItem
                onClick={handleCloseNavMenu}
                component={Link}
                href="/contact"
                sx={{
                  "&:hover": {
                    backgroundColor: "#283139",
                  },
                }}
              >
                <Typography textAlign="center">Contact</Typography>
              </MenuItem>
              {!!user?.role &&
                [RoleEnum.ADMIN].includes(Number(user?.role?.id)) && [
                  <MenuItem
                    key="users"
                    onClick={handleCloseNavMenu}
                    component={Link}
                    href="/admin-panel/users"
                    sx={{
                      "&:hover": {
                        backgroundColor: "#283139",
                      },
                    }}
                  >
                    <Typography textAlign="center">
                      {t("common:navigation.users")}
                    </Typography>
                  </MenuItem>,
                  // mobile-menu-items
                ]}
              {isLoaded &&
                !user && [
                  <Divider key="divider" sx={{ borderColor: "#283139" }} />,
                  <MenuItem
                    key="sign-in"
                    onClick={handleCloseNavMenu}
                    component={Link}
                    href="/sign-in"
                    sx={{
                      "&:hover": {
                        backgroundColor: "#283139",
                      },
                    }}
                  >
                    <Typography textAlign="center">
                      {t("common:navigation.signIn")}
                    </Typography>
                  </MenuItem>,
                  IS_SIGN_UP_ENABLED ? (
                    <MenuItem
                      key="sign-up"
                      onClick={handleCloseNavMenu}
                      component={Link}
                      href="/sign-up"
                      sx={{
                        "&:hover": {
                          backgroundColor: "#283139",
                        },
                      }}
                    >
                      <Typography textAlign="center">
                        {t("common:navigation.signUp")}
                      </Typography>
                    </MenuItem>
                  ) : null,
                ]}
            </Menu>
          </Box>{" "}
          {/* Logo ve Başlık - Mobil */}
          <Box
            sx={{
              display: { xs: "flex", md: "none" },
              flexGrow: 1,
              alignItems: "center",
              gap: 1,
            }}
          >
            <LogoIcon />
            <Typography
              variant="h6"
              noWrap
              component={Link}
              href="/"
              sx={{
                fontWeight: 700,
                letterSpacing: "-0.015em",
                color: "inherit",
                textDecoration: "none",
                fontFamily: '"Plus Jakarta Sans", "Noto Sans", sans-serif',
              }}
            >
              LinkYoSelf
            </Typography>
          </Box>
          {/* Desktop Navigation */}
          <Box sx={{ flexGrow: 1, display: { xs: "none", md: "flex" }, ml: 4 }}>
            <Button
              onClick={handleCloseNavMenu}
              component={Link}
              href="/"
              sx={{
                color: "white",
                textTransform: "none",
                fontSize: "14px",
                fontWeight: 500,
                mx: 1,
                "&:hover": {
                  color: "#60a5fa",
                  backgroundColor: "transparent",
                },
              }}
            >
              Home
            </Button>

            <Button
              onClick={handleCloseNavMenu}
              component={Link}
              href="/about"
              sx={{
                color: "white",
                textTransform: "none",
                fontSize: "14px",
                fontWeight: 500,
                mx: 1,
                "&:hover": {
                  color: "#60a5fa",
                  backgroundColor: "transparent",
                },
              }}
            >
              About
            </Button>

            <Button
              onClick={handleCloseNavMenu}
              component={Link}
              href="/contact"
              sx={{
                color: "white",
                textTransform: "none",
                fontSize: "14px",
                fontWeight: 500,
                mx: 1,
                "&:hover": {
                  color: "#60a5fa",
                  backgroundColor: "transparent",
                },
              }}
            >
              Contact
            </Button>

            {!!user?.role &&
              [RoleEnum.ADMIN].includes(Number(user?.role?.id)) && (
                <>
                  <Button
                    onClick={handleCloseNavMenu}
                    component={Link}
                    href="/admin-panel/users"
                    sx={{
                      color: "white",
                      textTransform: "none",
                      fontSize: "14px",
                      fontWeight: 500,
                      mx: 1,
                      "&:hover": {
                        color: "#60a5fa",
                        backgroundColor: "transparent",
                      },
                    }}
                  >
                    {t("common:navigation.users")}
                  </Button>
                  {/* desktop-menu-items */}
                </>
              )}
          </Box>
          <Box
            sx={{
              display: "flex",
              mr: 1,
            }}
          >
            {/* <ThemeSwitchButton /> */}
          </Box>
          {!isLoaded ? (
            <CircularProgress color="inherit" />
          ) : user ? (
            <>
              <Box sx={{ flexGrow: 0 }}>
                <Tooltip title="Profile menu">
                  <IconButton
                    onClick={handleOpenUserMenu}
                    sx={{ p: 0 }}
                    data-testid="profile-menu-item"
                  >
                    <Avatar
                      alt={user?.firstName + " " + user?.lastName}
                      src={user.photo?.path}
                    />
                  </IconButton>
                </Tooltip>
                <Menu
                  sx={{
                    mt: 5.5,
                    "& .MuiPaper-root": {
                      backgroundColor: "#1c2127",
                      borderRadius: "6px",
                      border: "1px solid #283139",
                    },
                  }}
                  id="menu-appbar"
                  anchorEl={anchorElementUser}
                  anchorOrigin={{
                    vertical: "top",
                    horizontal: "right",
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: "top",
                    horizontal: "right",
                  }}
                  open={Boolean(anchorElementUser)}
                  onClose={handleCloseUserMenu}
                >
                  <MenuItem
                    onClick={handleCloseUserMenu}
                    component={Link}
                    href="/profile"
                    data-testid="user-profile"
                    sx={{
                      "&:hover": {
                        backgroundColor: "#283139",
                      },
                    }}
                  >
                    <Typography textAlign="center">
                      {t("common:navigation.profile")}
                    </Typography>
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      logOut();
                      handleCloseUserMenu();
                    }}
                    data-testid="logout-menu-item"
                    sx={{
                      "&:hover": {
                        backgroundColor: "#283139",
                      },
                    }}
                  >
                    <Typography textAlign="center">
                      {t("common:navigation.logout")}
                    </Typography>
                  </MenuItem>
                </Menu>
              </Box>
            </>
          ) : (
            <Box
              sx={{ flexGrow: 0, display: { xs: "none", md: "flex" }, gap: 2 }}
            >
              <Button
                onClick={handleCloseNavMenu}
                sx={{
                  color: "white",
                  textTransform: "none",
                  fontSize: "14px",
                  fontWeight: 500,
                  "&:hover": {
                    color: "#60a5fa",
                    backgroundColor: "transparent",
                  },
                }}
                component={Link}
                href="/sign-in"
              >
                {t("common:navigation.signIn")}
              </Button>
              {IS_SIGN_UP_ENABLED && (
                <Button
                  onClick={handleCloseNavMenu}
                  sx={{
                    backgroundColor: "#1383eb",
                    color: "white",
                    textTransform: "none",
                    borderRadius: "6px",
                    padding: "8px 16px",
                    fontWeight: "bold",
                    "&:hover": {
                      backgroundColor: "#0e6ac7",
                    },
                  }}
                  component={Link}
                  href="/sign-up"
                >
                  {t("common:navigation.signUp")}
                </Button>
              )}
            </Box>
          )}
        </Toolbar>
      </Container>
    </StyledAppBar>
  );
}
export default ResponsiveAppBar;

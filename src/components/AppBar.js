import AppBar from "@mui/material/AppBar";
import Container from "@mui/material/Container";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import GitHubIcon from "@mui/icons-material/GitHub";
import VersionBadge from "./VersionBadge";
import Settings from "./Settings";
import { getTranslations as t } from "../../locales";
import Language from "../config/Language";
import { DarkModeLight } from "../config/Theme";
import { Box } from "@mui/material";

export default function NavAppBar() {
  return (
    <div>
      <AppBar color="transparent" position="static" elevation={0}>
        <Container maxWidth="lg">
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1, marginTop: '10px' }}>
              <a href="/">
                <img src="/assets/images/logo_new.png" alt="logo" width="40" />
              </a>
            </Typography>

            <Button
              color="inherit"
              href="/about/"
              sx={{
                textTransform: "none",
                color: (theme) => theme.palette.custom?.diamondBlack?.main || "rgba(0, 0, 0, 0.54)",
              }}
            >
              {t("about")}
            </Button>
            
            <IconButton
              href="https://github.com/Voornaamenachternaam/hatsmith"
              target="_blank"
              rel="noopener"
            >
              <GitHubIcon />
            </IconButton>
            
            <Box sx={{display: {xs: 'none', md: 'flex'}}}>
              <DarkModeLight />
            </Box>

            <Box sx={{display: {xs: 'none', md: 'flex'}}}>
              <Language />
            </Box>
            <Box sx={{display: {xs: 'flex', md: 'none'}}}>
              <Settings/>
            </Box>
            
            
          </Toolbar>
        </Container>
      </AppBar>
    </div>
  );
}

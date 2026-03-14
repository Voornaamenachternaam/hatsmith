import fs from "fs";
import path from "path";
import { marked } from "marked";
import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import AppBar from "@mui/material/AppBar";
import CssBaseline from "@mui/material/CssBaseline";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import MenuIcon from "@mui/icons-material/Menu";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { styled } from "@mui/material/styles";
import Link from "next/link";
import Container from "@mui/material/Container";
import Button from "@mui/material/Button";
import GitHubIcon from "@mui/icons-material/GitHub";
import Footer from "../src/components/Footer";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import StarsIcon from "@mui/icons-material/Stars";
import GetAppIcon from "@mui/icons-material/GetApp";
import EmojiObjectsIcon from "@mui/icons-material/EmojiObjects";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import LiveHelpIcon from "@mui/icons-material/LiveHelp";
import HistoryIcon from "@mui/icons-material/History";
import prism from "prismjs";
import Settings from "../src/components/Settings";
import { Box } from "@mui/material";
import { Theme, checkTheme, getCustom } from "../src/config/Theme";
import locales from "../locales/locales";
import { getTranslations as t } from "../locales";

const drawerWidth = 240;

marked.setOptions({
  highlight: function (code, lang) {
    if (prism.languages[lang]) {
      return prism.highlight(code, prism.languages[lang], lang);
    } else {
      return code;
    }
  },
});

const AboutRoot = styled('div')(({ theme }) => ({
  display: 'flex',
  backgroundColor: getCustom(theme).alabaster.main,
  minHeight: "100vh",
  flexDirection: "column",
}));

const MainWrapper = styled('div')(({ theme }) => ({
  display: 'flex',
  flex: 1,
}));

const ContentContainer = styled(Container)(({ theme }) => {
  const custom = getCustom(theme);
  return {
    padding: theme.spacing(3),
    marginTop: "20px",
    flexGrow: 1,

    "& h1": {
      marginTop: 20,
      color: custom.mineShaft.main,
      borderRadius: "8px",
      paddingBottom: 15,
      "& a": {
        textDecoration: "none",
        fontWeight: "bold",
        fontSize: 40,
        letterSpacing: "1px",
        borderBottom: `1px solid ${custom.mineShaft.main}`,
      },
    },

    "& h2": {
      color: custom.mineShaft.main,
      fontSize: "26px",
      paddingTop: 20,
      paddingBottom: 20,
      fontWeight: "700",
    },

    "& h3": {
      color: custom.mineShaft.main,
      fontSize: "24px",
      paddingTop: 20,
      paddingBottom: 20,
      fontWeight: "700",
    },

    "& a": {
      color: custom.mineShaft.main,
    },

    "& p": {
      fontSize: "17px",
      color: custom.mineShaft.main,
      lineHeight: 2,
      "& code": {
        backgroundColor: "#f1f1f1",
        wordWrap: "break-word",
        fontFamily: "inherit",
        paddingRight: 7,
        paddingLeft: 7,
        borderRadius: "3px",
      },
    },

    "& li": {
      padding: 2.5,
      fontSize: "18px",
      color: custom.mineShaft.main,
      "& a": {
        textDecoration: "none",
        letterSpacing: "0.5px",
        borderBottom: `1px solid ${custom.mineShaft.main}`,
      },
    },

    "& hr": {
      backgroundColor: custom.mercury.main,
      border: "none",
      height: "1.5px",
      marginTop: 20,
      marginBottom: 30,
    },

    "& ul": {
      paddingLeft: 25,
      paddingBottom: 15,
      fontSize: "16px",
      "& code": {
        backgroundColor: "#f1f1f1",
        wordWrap: "break-word",
        fontFamily: "inherit",
        paddingRight: 7,
        paddingLeft: 7,
        borderRadius: "3px",
      },
    },

    "& ol": {
      paddingLeft: 25,
      paddingBottom: 15,
      fontSize: "16px",
      "& code": {
        backgroundColor: "#f1f1f1",
        wordWrap: "break-word",
        fontFamily: "inherit",
        paddingRight: 7,
        paddingLeft: 7,
        borderRadius: "3px",
      },
    },

    "& pre": {
      background: "rgb(235, 235, 235)",
      padding: "13px",
      marginTop: "-5px",
      marginBottom: "20px",
      lineHeight: "1.3",
      fontSize: "14px",
      borderRadius: "3px",
      overflow: "auto",
      "& code": {
        color: custom.mineShaft.main,
      },
    },

    "& .codeBox": {
      "& pre": {
        background: "#2E3440",
        "& code": {
          color: "#f8f8f2",
        },
      },
    },

    "& blockquote": {
      backgroundColor: "#f1f1f1",
      marginTop: "15px",
      color: "#535a60",
      borderLeft: "5px solid #c8ccd0",
      marginBottom: 20,
      "& p": {
        padding: 10,
      },
    },
  };
});

export default function About(props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [docContent, setDocContent] = useState("");

  useEffect(() => {
    checkTheme();
  }, []);

  useEffect(() => {
    const getLocale = () => {
      if (typeof window !== "undefined") {
        let language = window.localStorage.getItem("language");
        let userLanguage = navigator.language.replace("-", "_");
        return language ? language : locales[userLanguage] ? userLanguage : "en_US";
      }
    };

    let languages = props.docs;
    let langFilter = { lang: getLocale() };
    let langResult;

    languages.forEach(function (obj) {
      let matches = true;
      for (let key in langFilter) {
        if (langFilter[key] !== obj[key]) {
          matches = false;
        }
      }
      if (matches) {
        langResult = obj;
      } else {
        setDocContent(languages[0].content);
      }
    });

    if (langResult) {
      setDocContent(langResult.content);
    }
  }, [props.docs]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleClose = () => {
    setMobileOpen(false);
  };

  const drawer = (
    <div>
      <Toolbar />
      <List>
        <ListItem disablePadding>
          <ListItemButton component="a" href="#">
            <ListItemText primary="Hat.sh Documentation" />
          </ListItemButton>
        </ListItem>
      </List>

      <Divider />
      <List>
        {[
          { name: t("introduction"), icon: <BookmarkBorderIcon /> },
          { name: t("features"), icon: <StarsIcon /> },
          { name: t("installation"), icon: <GetAppIcon /> },
          { name: t("usage"), icon: <EmojiObjectsIcon /> },
          { name: t("limitations"), icon: <ErrorOutlineIcon /> },
          { name: t("best_practices"), icon: <VerifiedUserIcon /> },
          { name: t("faq"), icon: <LiveHelpIcon /> },
          { name: t("technical_details"), icon: <MenuBookIcon /> },
          { name: t("changelog"), icon: <HistoryIcon /> },
        ].map((text, index) => (
          <ListItem key={index} disablePadding>
            <Link href={"#" + text.name.toLowerCase()} passHref legacyBehavior>
              <ListItemButton onClick={handleClose}>
                <ListItemIcon>{text.icon}</ListItemIcon>
                <ListItemText primary={text.name} />
              </ListItemButton>
            </Link>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <AboutRoot>
      <CssBaseline />

      <AppBar
        color="transparent"
        position="fixed"
        sx={{
          backgroundColor: (theme) => getCustom(theme).alabaster.main,
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
        elevation={0}
      >
        <Container maxWidth="lg">
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { xl: 'none' } }}
            >
              <MenuIcon />
            </IconButton>

            <Typography variant="h6" sx={{ flexGrow: 1, marginTop: '5px' }}>
              <a href="/">
                <img src="/assets/images/logo_new.png" alt="logo" width="40" />
              </a>
            </Typography>

            <Button
              color="inherit"
              href="/"
              sx={{
                textTransform: "none",
                color: (theme) => getCustom(theme).diamondBlack.main
              }}
            >
              {t('home')}
            </Button>

            <IconButton
              href="https://github.com/Voornaamenachternaam/hatsmith"
              target="_blank"
              rel="noopener"
            >
              <GitHubIcon />
            </IconButton>

            <Settings />
          </Toolbar>
        </Container>
      </AppBar>

      <MainWrapper>
        <Box
          component="nav"
          sx={{ width: { xl: drawerWidth }, flexShrink: { xl: 0 } }}
          aria-label="mailbox folders"
        >
          {/* Mobile drawer */}
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true, // Better open performance on mobile.
            }}
            sx={{
              display: { xs: 'block', xl: 'none' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
            }}
          >
            {drawer}
          </Drawer>
          {/* Desktop drawer */}
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', xl: 'block' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
            }}
            open
          >
            {drawer}
          </Drawer>
        </Box>

        <Box component="main" sx={{ flexGrow: 1, paddingTop: '64px' }}>
          <ContentContainer maxWidth="lg">
            <Box sx={{ minHeight: '1px' }} />
            <div dangerouslySetInnerHTML={{ __html: marked(docContent) }}></div>
            <div dangerouslySetInnerHTML={{ __html: marked(props.changelog) }}></div>
          </ContentContainer>
          <Footer />
        </Box>
      </MainWrapper>
    </AboutRoot>
  );
}

About.propTypes = {
  window: PropTypes.func,
};

export async function getStaticProps() {
  let docs = [];
  Object.entries(locales).map(([code, name]) => {
    let docFilePath = `locales/${code}/docs.md`;
    let docFile;
    try {
      docFile = fs.readFileSync(path.join(docFilePath), "utf-8");
    } catch (error) {
      docFile = fs.readFileSync(path.join(`locales/en_US/docs.md`), "utf-8");
    }
    let docStructure = { lang: code, content: docFile };
    docs.push(docStructure);
  });
  const changelog = fs.readFileSync("CHANGELOG.md", "utf-8");
  return {
    props: {
      docs: docs,
      changelog: changelog,
    },
  };
}

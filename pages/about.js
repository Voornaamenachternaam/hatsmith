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
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import MenuIcon from "@mui/icons-material/Menu";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
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
import { ThemeProvider as MuiThemeProvider } from "@mui/system";
import { Theme, checkTheme } from "../src/config/Theme";
import locales from "../locales/locales";
import { getTranslations as t } from "../locales";
import Box from "@mui/material/Box";
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
        //default en docs
        setDocContent(languages[0].content);
      }
    });

    const getContent = async () => {
      for (const key in langResult) {
        if (key == "content") {
          setDocContent(langResult[key]);
        }
      }
    };

    getContent();
  }, [props.docs]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleClose = () => {
    mobileOpen ? setMobileOpen(false) : null;
  };

  const drawer = (
    <Box>
      <Box sx={(theme) => theme.mixins.toolbar} />

      <List>
        <ListItem button component="a">
          <ListItemText primary="Hat.sh Documentation" />
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
          <div onClick={handleClose} key={index}>
            <Link href={"#" + text.name.toLowerCase()} passHref>
              <ListItem button>
                <ListItemIcon>{text.icon}</ListItemIcon>
                <ListItemText primary={text.name} />
              </ListItem>
            </Link>
          </div>
        ))}
      </List>
    </Box>
  );
  return (
    <MuiThemeProvider theme={Theme}>
      <Box sx={{
        backgroundColor: (theme) => theme.palette.custom?.alabaster?.main || "#fafafa",
        minHeight: "100vh",
      }}>
        <CssBaseline />

        <AppBar
          color="transparent"
          position="fixed"
          sx={{
            backgroundColor: (theme) => theme.palette.custom?.alabaster?.main || "#fafafa",
            width: "100%",
            zIndex: (theme) => theme.zIndex.drawer - 1,
          }}
          elevation={0}
        >
          <Container maxWidth="lg">
            <Toolbar>

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
                  color: (theme) => theme.palette.custom?.diamondBlack?.main || "rgba(0, 0, 0, 0.54)",
                }}
              >
                {t('home')}
              </Button>

              <IconButton
                href="https://github.com/sh-dv/hat.sh"
                target="_blank"
                rel="noopener"
              >
                <GitHubIcon />
              </IconButton>

              <Settings />
            </Toolbar>
          </Container>
        </AppBar>

        
        <Box
          component="main"
          sx={{
            padding: (theme) => theme.spacing(3),
            marginTop: "20px",

            "& h1": {
              marginTop: '20px',
              color: (theme) => theme.palette.custom?.mineShaft?.main || "#3f3f3f",
              borderRadius: "8px",
              paddingBottom: '15px',
              "& a": {
                textDecoration: "none",
                fontWeight: "bold",
                fontSize: '40px',
                letterSpacing: "1px",
                borderBottom: "1px solid #000",
              },
            },

            "& h2": {
              color: (theme) => theme.palette.custom?.mineShaft?.main || "#3f3f3f",
              fontSize: "26px",
              paddingTop: '20px',
              paddingBottom: '20px',
              fontWeight: "700",
            },

            "& h3": {
              color: (theme) => theme.palette.custom?.mineShaft?.main || "#3f3f3f",
              fontSize: "24px",
              paddingTop: '20px',
              paddingBottom: '20px',
              fontWeight: "700",
            },

            "& a": {
              color: (theme) => theme.palette.custom?.mineShaft?.main || "#3f3f3f",
            },

            "& p": {
              fontSize: "17px",
              color: (theme) => theme.palette.custom?.mineShaft?.main || "#3f3f3f",
              lineHeight: 2,
              "& code": {
                backgroundColor: "#f1f1f1",
                wordWrap: "break-word",
                fontFamily: "inherit",
                paddingRight: '7px',
                paddingLeft: '7px',
                borderRadius: "3px",
              },
            },

            "& li": {
              padding: '2.5px',
              fontSize: "18px",
              color: (theme) => theme.palette.custom?.mineShaft?.main || "#3f3f3f",
              "& a": {
                textDecoration: "none",
                letterSpacing: "0.5px",
                borderBottom: "1px solid #000",
              },
            },

            "& hr": {
              backgroundColor: (theme) => theme.palette.custom?.mercury?.main || "#e9e9e9",
              border: "none",
              height: "1.5px",
              marginTop: '20px',
              marginBottom: '30px',
            },

            "& ul": {
              paddingLeft: '25px',
              paddingBottom: '15px',
              fontSize: "16px",
              "& code": {
                backgroundColor: "#f1f1f1",
                wordWrap: "break-word",
                fontFamily: "inherit",
                paddingRight: '7px',
                paddingLeft: '7px',
                borderRadius: "3px",
              },
            },

            "& ol": {
              paddingLeft: '25px',
              paddingBottom: '15px',
              fontSize: "16px",
              "& code": {
                backgroundColor: "#f1f1f1",
                wordWrap: "break-word",
                fontFamily: "inherit",
                paddingRight: '7px',
                paddingLeft: '7px',
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
                color: (theme) => theme.palette.custom?.mineShaft?.main || "#3f3f3f",
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
              marginBottom: '20px',
              "& p": {
                padding: '10px',
              },
            },
          }}
        >
          <Container maxWidth="lg">
            <Box sx={(theme) => theme.mixins.toolbar} />

            <div dangerouslySetInnerHTML={{ __html: marked(docContent) }}></div>
            <div
              dangerouslySetInnerHTML={{ __html: marked(props.changelog) }}
            ></div>
          </Container>
        </Box>

        <Footer />
      </Box>
    </MuiThemeProvider>
  );
}

About.propTypes = {
  /**
   * Injected by the documentation to work in an iframe.
   * You won't need it on your project.
   */
  window: PropTypes.func,
};

export async function getStaticProps() {
  // Get files from the posts dir

  let docs = [];

  {
    Object.entries(locales).map(([code, name]) => {
      let docFilePath = `locales/${code}/docs.md`;
      let docFile;
      try {
        docFile = fs.readFileSync(
          path.join(docFilePath),
          "utf-8"
        );
      } catch (error) {
        docFile = fs.readFileSync(
          path.join(`locales/en_US/docs.md`),
          "utf-8"
        );
      }
      
      let docStructure = { lang: code, content: docFile };
      docs.push(docStructure);
    });
  }

  const changelog = fs.readFileSync("CHANGELOG.md", "utf-8");

  return {
    props: {
      docs: docs,
      changelog: changelog,
    },
  };
}

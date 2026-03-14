import { ThemeProvider } from "@mui/material/styles";
import { ThemeProvider as StylesThemeProvider } from "@mui/styles";
import { Theme } from "../src/config/Theme";
import NavAppBar from "../src/components/AppBar";
import Footer from "../src/components/Footer";
import Hero from "../src/components/Hero";
import Container from "@mui/material/Container";
import KeyPairGeneration from "../src/components/KeyPairGeneration";
import { makeStyles } from "@mui/styles";
import { Theme as hsTheme } from "../src/config/Theme";

const useStyles = makeStyles((theme) => ({
  page: {
    backgroundColor: theme?.palette?.custom?.alabaster?.main || hsTheme.palette.custom.alabaster.main,
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
  },
}));

const Generate = () => {
  const classes = useStyles();
  return (
    <ThemeProvider theme={Theme}>
      <StylesThemeProvider theme={Theme}>
      <div
        className={classes.page}
      >
        <NavAppBar />
        <Hero />
        <Container
          style={{
            maxWidth: "768px",
          }}
        >
          <KeyPairGeneration opened={true} />
        </Container>

        <Footer />
      </div>
      </StylesThemeProvider>
    </ThemeProvider>
  );
};

export default Generate;

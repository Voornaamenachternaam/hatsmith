import { ThemeProvider } from "@mui/system";
import { Theme } from "../src/config/Theme";
import NavAppBar from "../src/components/AppBar";
import Footer from "../src/components/Footer";
import Hero from "../src/components/Hero";
import Container from "@mui/material/Container";
import KeyPairGeneration from "../src/components/KeyPairGeneration";
import Box from "@mui/material/Box";

const Generate = () => {
  return (
    <ThemeProvider theme={Theme}>
      <Box
        sx={{
          backgroundColor: (theme) => theme.palette.custom?.alabaster?.main || "#fafafa",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
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
      </Box>
    </ThemeProvider>
  );
};

export default Generate;

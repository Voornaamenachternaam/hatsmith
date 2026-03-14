import NavAppBar from "../src/components/AppBar";
import Footer from "../src/components/Footer";
import Hero from "../src/components/Hero";
import Container from "@mui/material/Container";
import KeyPairGeneration from "../src/components/KeyPairGeneration";
import { Box } from "@mui/material";
import { getCustom } from "../src/config/Theme";

const Generate = () => {
  return (
      <Box
        sx={{
          backgroundColor: (theme) => getCustom(theme).alabaster.main,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <NavAppBar />
        <Hero />
        <Container
          sx={{
            maxWidth: "768px !important",
          }}
        >
          <KeyPairGeneration opened={true} />
        </Container>

        <Footer />
      </Box>
  );
};

export default Generate;

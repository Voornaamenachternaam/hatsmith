import { Box } from "@mui/material";
import NavAppBar from "../components/AppBar";
import Hero from "../components/Hero";
import LimitedPanels from "../components/limited/LimitedPanels";
import Footer from "../components/Footer";
import { getCustom } from "../config/Theme";

const LimitedContainer = () => {
  return (
    <Box sx={{
        backgroundColor: (theme) => getCustom(theme).alabaster.main,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}>
      <NavAppBar />
      <Hero />
      <LimitedPanels />
      <Footer />
    </Box>
  );
};

export default LimitedContainer;

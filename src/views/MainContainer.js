import { Box } from "@mui/material";
import NavAppBar from "../components/AppBar";
import Hero from "../components/Hero";
import Panels from "../components/Panels";
import Footer from "../components/Footer";
import CheckMultipleTabs from "../config/CheckMultipleTabs";
import { getCustom } from "../config/Theme";

const MainContainer = () => {
  return (
    <Box sx={{
        backgroundColor: (theme) => getCustom(theme).alabaster.main,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}>
      <CheckMultipleTabs />
      <NavAppBar />
      <Hero />
      <Panels />
      <Footer />
    </Box>
  );
};

export default MainContainer;

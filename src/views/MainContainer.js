import NavAppBar from "../components/AppBar";
import Hero from "../components/Hero";
import Panels from "../components/Panels";
import Footer from "../components/Footer";
import CheckMultipleTabs from "../config/CheckMultipleTabs";
import Box from "@mui/material/Box";

const MainContainer = () => {
  return (
    <Box sx={{
        backgroundColor: (theme) => theme.palette.custom?.alabaster?.main || "#fff",
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

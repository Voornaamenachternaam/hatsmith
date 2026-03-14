import { makeStyles } from "@mui/styles";
import NavAppBar from "../components/AppBar";
import Hero from "../components/Hero";
import Panels from "../components/Panels";
import Footer from "../components/Footer";
import CheckMultipleTabs from "../config/CheckMultipleTabs";



const useStyles = makeStyles((theme) => ({
  root: {
    backgroundColor: theme.palette.custom?.alabaster?.main || "#fff",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
  },
}));

const MainContainer = () => {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <CheckMultipleTabs />
      <NavAppBar />
      <Hero />
      <Panels />
      <Footer />
    </div>
  );
};

export default MainContainer;

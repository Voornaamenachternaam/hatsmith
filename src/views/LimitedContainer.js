import { makeStyles } from "@mui/styles";
import NavAppBar from "../components/AppBar";
import Hero from "../components/Hero";
import LimitedPanels from "../components/limited/LimitedPanels";
import Footer from "../components/Footer";

const useStyles = makeStyles((theme) => ({
  root: {
    backgroundColor: theme.palette.custom?.alabaster?.main || "#fff",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
  },
}));

const LimitedContainer = () => {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <NavAppBar />
      <Hero />
      <LimitedPanels />
      <Footer />
    </div>
  );
};

export default LimitedContainer;

import { useEffect, useState } from "react";
import LoadingCom from "../src/components/Loading";
import CheckMultipleTabs from "../src/config/CheckMultipleTabs";
import Panels from "../src/components/Panels";
import Footer from "../src/components/Footer";
import LimitedPanels from "../src/components/limited/LimitedPanels";
import { Box } from "@mui/material";
import { getCustom } from "../src/config/Theme";

const Home = () => {
  const [swReg, setSwReg] = useState();
  const [browserSupport, setBrowserSupport] = useState();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const safariBrowser =
      typeof navigator !== 'undefined' &&
      /Safari/.test(navigator.userAgent) &&
      /Apple Computer/.test(navigator.vendor);
    const mobileBrowser =
      typeof navigator !== 'undefined' &&
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );

    if (safariBrowser || mobileBrowser) {
      setBrowserSupport(false);
    } else {
      setBrowserSupport(true);
    }

    //register service worker
    if (typeof navigator !== 'undefined' && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/service-worker.js")
        .then((reg) => {
          reg.update();
          setSwReg(true);
          setLoading(false);
        })
        .catch((err) => {
          console.log("ServiceWorker registration failed", err);
          setSwReg(false);
          setLoading(false);
        });
    } else {
      setSwReg(false);
      setLoading(false);
    }
  }, []);

  return (
    <>
      <LoadingCom open={loading} />
      {!loading &&
        (swReg && browserSupport ? (
          <Box
            sx={{
              backgroundColor: (theme) => getCustom(theme).alabaster.main,
              minHeight: "100vh",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <CheckMultipleTabs />
            <Panels />
            <Footer />
          </Box>
        ) : (
          <Box sx={{
              backgroundColor: (theme) => getCustom(theme).alabaster.main,
              minHeight: "100vh",
              display: "flex",
              flexDirection: "column",
            }}>
            <LimitedPanels />
            <Footer />
          </Box>
        ))}
      <Box sx={{ display: "flex", justifyContent: "center", color: "grey", textAlign: "center" }}>
        <span className="text-center">Hatsmith is running in headless mode.</span>
      </Box>
    </>
  );
};

export default Home;

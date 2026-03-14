import { useEffect, useState } from "react";
import MainContainer from "../src/views/MainContainer";
import LimitedContainer from "../src/views/LimitedContainer";
import { ThemeProvider } from "@mui/system";
import { Theme } from "../src/config/Theme";
import LoadingCom from "../src/components/Loading";
import CheckMultipleTabs from "../src/config/CheckMultipleTabs";
import Panels from "../src/components/Panels";
import Footer from "../src/components/Footer";
import LimitedPanels from "../src/components/limited/LimitedPanels";
const Home = () => {
  const [swReg, setSwReg] = useState();
  const [browserSupport, setBrowserSupport] = useState();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const safariBrowser =
      /Safari/.test(navigator.userAgent) &&
      /Apple Computer/.test(navigator.vendor);
    const mobileBrowser =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );

    if (safariBrowser || mobileBrowser) {
      setBrowserSupport(false);
    } else {
      setBrowserSupport(true);
    }

    //register service worker
    if ("serviceWorker" in navigator) {
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
      // console.log("did not register sw");
      setSwReg(false);
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <ThemeProvider theme={Theme}>
          <LoadingCom open={loading} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={Theme}>
      {swReg && browserSupport ? (
          <>
            <div
              style={{
                backgroundColor: Theme.palette.custom?.alabaster?.main || "#fff",
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <CheckMultipleTabs />
              <Panels />
              <Footer />
            </div>
          </>
        ) : (
          <>
          <div style={{
                  backgroundColor: Theme.palette.custom?.alabaster?.main || "#fff",
                  minHeight: "100vh",
                  display: "flex",
                  flexDirection: "column",
                }}>
                <LimitedPanels />
                <Footer />
              </div>
          </>
        )}
      <div style={{ display: "flex", justifyContent: "center", color: "grey", textAlign: "center" }}>
        <span className="text-center">Hatsmith is running in headless mode.</span>
      </div>
    </ThemeProvider>
  );
};

export default Home;

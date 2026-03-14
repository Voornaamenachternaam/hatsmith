import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import PropTypes from "prop-types";
import AppBar from "@mui/material/AppBar";
import Container from "@mui/material/Container";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import LimitedEncryptionPanel from "./LimitedEncryptionPanel";
import LimitedDecryptionPanel from "./LimitedDecryptionPanel";
import LimitedAlert from "./LimitedAlert";
import { getTranslations as t } from "../../../locales";
import { styled } from "@mui/system";
import Box from "@mui/material/Box";

const StyledTabs = styled((props) => (
  <Tabs {...props} TabIndicatorProps={{ children: <span /> }} />
))({
  "& .MuiTabs-indicator": {
    display: "none",
  },
});

const StyledTab = styled((props) => <Tab disableRipple {...props} />)(({ theme }) => ({
  textTransform: "none",
  padding: "8px",
  transition: "background-color 0.2s ease-out",

  "&.Mui-selected": {
    backgroundColor: theme.palette.custom?.white?.main || "#ffffff",
    boxShadow: "rgba(149, 157, 165, 0.2) 0px 8px 24px",
    borderRadius: "8px",
  },
}));

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {children}
    </Box>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.any.isRequired,
  value: PropTypes.any.isRequired,
};

export default function LimitedPanels() {
  const router = useRouter();
  const query = router.query;
  const [value, setValue] = useState(0);
  const encryption = { tab: 0, label: t('encryption') };
  const decryption = { tab: 1, label: t('decryption') };


  const handleChange = (event, newValue) => {
    setValue(newValue);
    router.replace(router.pathname);
  };

  useEffect(() => {

    if (query.tab && query.tab === "encryption") {
      setValue(encryption.tab);
    }

    if (query.tab && query.tab === "decryption") {
      setValue(decryption.tab);
    }

  }, [decryption.tab, encryption.tab, query.tab]);

  return (
    <>
      <Container sx={{ maxWidth: "768px !important" }}>
        <LimitedAlert />
        <AppBar
          position="static"
          sx={{
            marginTop: '15px',
            backgroundColor: (theme) => theme.palette.custom?.gallery?.main || "#ebebeb",
            borderRadius: "8px",
            padding: '8px',
          }}
          elevation={0}
        >
          <StyledTabs
            value={value}
            onChange={handleChange}
            variant="fullWidth"
            centered
          >
            <StyledTab
              label={encryption.label}
              sx={{ color: (theme) => theme.palette.custom?.emperor?.main || "#525252" }}
            />
            <StyledTab
              label={decryption.label}
              sx={{ color: (theme) => theme.palette.custom?.emperor?.main || "#525252" }}
            />
          </StyledTabs>
        </AppBar>

        <TabPanel
          value={value}
          index={encryption.tab}
          sx={{ marginTop: '15px' }}
        >
          <LimitedEncryptionPanel />
        </TabPanel>
        <TabPanel
          value={value}
          index={decryption.tab}
          sx={{ marginTop: '15px' }}
        >
          <LimitedDecryptionPanel />
        </TabPanel>
      </Container>
    </>
  );
}

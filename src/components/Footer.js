/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import Link from "@mui/material/Link";
import { Box, Chip, Avatar, Dialog, DialogTitle, DialogContent, DialogContentText, Tabs, Tab, TextField, Tooltip, IconButton, DialogActions, Button, Snackbar, Alert } from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import FileCopyIcon from "@mui/icons-material/FileCopy";
import { getTranslations as t } from "../../locales";
import { getCustom } from "../config/Theme";
import { QRCodeSVG } from "qrcode.react";

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`donation-tabpanel-${index}`}
      aria-labelledby={`donation-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

export default function Footer() {
  const [tabValue, setTabValue] = useState(0);
  const [currAvatar, setCurrAvatar] = useState("xmr");
  const [donateDialog, setDonateDialog] = useState(false);
  const [snackOpen, setSnackOpen] = useState(false);

  const cryptoAddrs = [
    {
      type: "monero",
      alt: "xmr",
      addr: "3",
    },
    {
      type: "bitcoin",
      alt: "btc",
      addr: "2",
    },
    {
      type: "ethereum",
      alt: "eth",
      addr: "1",
    },
  ];

  const handleSnackClose = (event, reason) => {
    if (reason === "clickaway") return;
    setSnackOpen(false);
    handleSnackOpen();
  };

  const handleSnackOpen = () => {
    setTimeout(function () {
      setSnackOpen(true);
    }, 60000);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleClickOpen = () => {
    setDonateDialog(true);
  };

  const handleClose = () => {
    setDonateDialog(false);
  };

  useEffect(() => {
    handleSnackOpen();

    const avatarInterval = setInterval(() => {
      setCurrAvatar(
        cryptoAddrs[Math.floor(Math.random() * cryptoAddrs.length)].alt
      );
    }, 10000);
    return () => clearInterval(avatarInterval);
  }, []);

  return (
    <Box sx={{ marginTop: "auto" }}>
      <Box
        component="footer"
        sx={{
          textAlign: "center",
          color: (theme) => getCustom(theme).diamondBlack.main,
          padding: (theme) => theme.spacing(3, 2),
        }}
      >
        <Container maxWidth="sm">
          <Typography variant="body1">
            Maintained by {" "}
            <Link
              href="https://github.com/Voornaamenachternaam"
              target="_blank"
              rel="noopener"
              color="inherit"
            >
              {"Voornaamenachternaam"}
            </Link>
          </Typography>
          <Typography variant="body1">
            Hatsmith is a fork of{" "}
            <Link
              href="https://github.com/Voornaamenachternaam/hatsmith"
              target="_blank"
              rel="noopener"
              color="inherit"
            >
              {"hat.sh"}
            </Link>
            {" "}by {" "}
            <Link
              href="https://github.com/Voornaamenachternaam"
              target="_blank"
              rel="noopener"
              color="inherit"
            >
              {"Voornaamenachternaam"}
            </Link>
          </Typography>

          <Chip
            size="small"
            sx={{
              marginTop: '5px',
              border: "none",
              borderRadius: '8px',
              textTransform: "none",
              boxShadow: "none",
              color: (theme) => getCustom(theme).diamondBlack.main,
              backgroundColor: (theme) => getCustom(theme).alto.light,
              "&:hover": {
                backgroundColor: (theme) => getCustom(theme).alto.main,
              },
              "&:focus": {
                backgroundColor: (theme) => getCustom(theme).alto.main,
                boxShadow: "none",
              },
              transition: "background-color 0.2s ease-out, color .01s",
            }}
            avatar={
              <Avatar src={`/assets/icons/${currAvatar}-logo.png`}></Avatar>
            }
            label="Donations Accepted"
            clickable
            onClick={() => handleClickOpen()}
            onDelete={() => handleClickOpen()}
            deleteIcon={<MonetizationOnIcon sx={{ color: (theme) => getCustom(theme).mountainMist.main }} />}
          />

          <Dialog
            scroll="body"
            maxWidth="sm"
            fullWidth
            open={donateDialog}
            onClose={handleClose}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
            PaperProps={{
              elevation: 0,
            }}
            sx={{
              '& .MuiDialog-container': {
                alignItems: "start",
                marginTop: "10vh",
              },
            }}
          >
            <DialogTitle>{"Donations"}</DialogTitle>

            <DialogContent>
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <DialogContentText sx={{ textAlign: "center" }}>
                 Na
                </DialogContentText>
              </Box>

              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                indicatorColor="primary"
                textColor="primary"
                sx={{ marginBottom: '15px' }}
                centered
              >
                {cryptoAddrs.map((res, index) => (
                  <Tab label={res.type} key={index} />
                ))}
              </Tabs>

              {cryptoAddrs.map((res, index) => (
                <TabPanel value={tabValue} index={index} key={index}>
                  <Box sx={{
                    display: "flex",
                    flexDirection: "column",
                    margin: "auto",
                    width: "fit-content",
                    marginBottom: '20px',
                  }}>
                    <QRCodeSVG
                      style={{
                        borderRadius: 8,
                        margin: 10,
                        boxShadow: "0px 0px 35px 2px rgba(0,0,0,0.2)",
                      }}
                      value={`${res.type}:${res.addr}`}
                      size={200}
                      bgColor={"#ffffff"}
                      fgColor={"#000000"}
                      level={"M"}
                      includeMargin={true}
                      imageSettings={{
                        src: `/assets/icons/${res.alt}-logo.png`,
                        x: null,
                        y: null,
                        height: 40,
                        width: 40,
                        excavate: false,
                      }}
                    />
                  </Box>
                  <TextField
                    sx={{ marginBottom: '15px' }}
                    defaultValue={res.addr}
                    label={res.type}
                    slotProps={{
                      input: {
                        readOnly: true,
                        endAdornment: (
                          <>
                            <Tooltip title="Copy address" placement="left">
                              <IconButton
                                onClick={() => {
                                  navigator.clipboard.writeText(res.addr);
                                }}
                              >
                                <FileCopyIcon />
                              </IconButton>
                            </Tooltip>
                          </>
                        ),
                      }
                    }}
                    variant="outlined"
                    fullWidth
                  />
                </TabPanel>
              ))}
            </DialogContent>
            <DialogActions>
              <Button
                sx={{ marginBottom: '1px' }}
                href="https://ko-fi.com/shdvapps"
                target="_blank"
              >
                <img
                  src="/assets/icons/ko-fi.png"
                  width="200"
                  alt="ko-fi"
                ></img>
              </Button>
              <Box sx={{ flex: "1 0 0" }} />
              <Button onClick={handleClose} color="primary">
                {t("close")}
              </Button>
            </DialogActions>
          </Dialog>
        </Container>
      </Box>

      <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
        <Snackbar
          sx={{ zIndex: 1 }}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          open={snackOpen}
          autoHideDuration={10000}
          onClose={handleSnackClose}
        >
          <Alert
            severity="info"
            action={
              <Button color="inherit" size="small" onClick={handleClickOpen}>
                <svg
                  enableBackground="new 0 0 24 24"
                  height="24"
                  viewBox="0 0 24 24"
                  width="24"
                >
                  <g>
                    <rect fill="none" height="24" width="24" />
                  </g>
                  <g>
                    <g>
                      <rect fill="#427aa6" height="11" width="4" x="1" y="11" />
                      <path
                        fill="#427aa6"
                        d="M16,3.25C16.65,2.49,17.66,2,18.7,2C20.55,2,22,3.45,22,5.3c0,2.27-2.91,4.9-6,7.7c-3.09-2.81-6-5.44-6-7.7 C10,3.45,11.45,2,13.3,2C14.34,2,15.35,2.49,16,3.25z"
                      />
                      <path
                        fill="#427aa6"
                        d="M20,17h-7l-2.09-0.73l0.33-0.94L13,16h2.82c0.65,0,1.18-0.53,1.18-1.18v0c0-0.49-0.31-0.93-0.77-1.11L8.97,11H7v9.02 L14,22l8.01-3v0C22,17.9,21.11,17,20,17z"
                      />
                    </g>
                  </g>
                </svg>
              </Button>
            }
          >
            {t("donation_message")}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
}

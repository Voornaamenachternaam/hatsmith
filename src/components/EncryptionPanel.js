import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useDropzone } from "react-dropzone";
import { formatBytes } from "../helpers/formatBytes";
import KeyPairGeneration from "./KeyPairGeneration";
import { generatePassword, generatePassPhrase } from "../utils/generatePassword";
import { computePublicKey } from "../utils/computePublicKey";
import passwordStrengthCheck from "../utils/passwordStrengthCheck";
import { CHUNK_SIZE } from "../config/Constants";
import { Alert, AlertTitle, Box, Grid, Stepper, Step, StepLabel, StepContent, Button, Paper, Typography, TextField, CircularProgress, Backdrop, IconButton, Tooltip, Radio, RadioGroup, FormControlLabel, FormControl, Snackbar, Collapse, List, ListItem, ListItemSecondaryAction, ListItemText } from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import CachedIcon from "@mui/icons-material/Cached";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import FileCopyIcon from "@mui/icons-material/FileCopy";
import RefreshIcon from "@mui/icons-material/Refresh";
import DescriptionIcon from "@mui/icons-material/Description";
import GetAppIcon from "@mui/icons-material/GetApp";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import LinkIcon from "@mui/icons-material/Link";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import RotateLeftIcon from "@mui/icons-material/RotateLeft";
import DeleteIcon from "@mui/icons-material/Delete";
import InfoIcon from "@mui/icons-material/Info";
import FileInfoDialog from "./FileInfoDialog.jsx";
import { getTranslations as t } from "../../locales";
import { getCustom } from "../config/Theme";

let file,
  files = [],
  password,
  index,
  currFile = 0,
  numberOfFiles,
  encryptionMethodState = "secretKey",
  privateKey,
  publicKey;

export default function EncryptionPanel() {
  const router = useRouter();
  const query = router.query;

  const [activeStep, setActiveStep] = useState(0);
  const [Files, setFiles] = useState([]);
  const [currFileState, setCurrFileState] = useState(0);
  const [sumFilesSizes, setSumFilesSizes] = useState(0);
  const [Password, setPassword] = useState();
  const [showPassword, setShowPassword] = useState(false);
  const [PublicKey, setPublicKey] = useState();
  const [PrivateKey, setPrivateKey] = useState();
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [wrongPublicKey, setWrongPublicKey] = useState(false);
  const [wrongPrivateKey, setWrongPrivateKey] = useState(false);
  const [keysError, setKeysError] = useState(false);
  const [keysErrorMessage, setKeysErrorMessage] = useState();
  const [shortPasswordError, setShortPasswordError] = useState(false);
  const [encryptionMethod, setEncryptionMethod] = useState("secretKey");
  const [isDownloading, setIsDownloading] = useState(false);
  const [shareableLink, setShareableLink] = useState();
  const [snackBarOpen, setSnackBarOpen] = useState(false);
  const [snackBarMessage, setSnackBarMessage] = useState();
  const [pkAlert, setPkAlert] = useState(false);
  const [isPassphraseMode, setIsPassphraseMode] = useState(false);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      handleFilesInput(acceptedFiles);
    },
    noClick: true,
    noKeyboard: true,
    disabled: activeStep !== 0,
  });

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
    setWrongPublicKey(false);
    setWrongPrivateKey(false);
    setKeysError(false);
    setShortPasswordError(false);
  };

  const handleRadioChange = (method) => {
    if (method === "secretKey2") {
      setIsPassphraseMode(true);
      method = "secretKey";
    } else {
      setIsPassphraseMode(false);
    }
    setEncryptionMethod(method);
    encryptionMethodState = method;
  };

  const handleReset = () => {
    setActiveStep(0);
    setFiles([]);
    setPassword();
    setPublicKey();
    setPrivateKey();
    privateKey = null;
    publicKey = null;
    setWrongPublicKey(false);
    setWrongPrivateKey(false);
    setKeysError(false);
    setShortPasswordError(false);
    setIsDownloading(false);
    setShareableLink();
    setSnackBarMessage();
    setPkAlert(false);
    setSumFilesSizes(0);
    file = null;
    files = [];
    numberOfFiles = 0;
    resetCurrFile();
    index = null;
    router.replace(router.pathname);
  };

  const showSnackBar = () => {
    setSnackBarOpen(!snackBarOpen);
  };

  const resetCurrFile = () => {
    currFile = 0;
    setCurrFileState(currFile);
  };

  const updateCurrFile = () => {
    currFile += 1;
    setCurrFileState(currFile);
  };

  const handleMethodStep = () => {
    if (encryptionMethodState === "secretKey") {
      if (Password && Password.length >= 12) {
        setActiveStep(2);
      } else {
        setShortPasswordError(true);
      }
    }

    if (encryptionMethodState === "publicKey") {
      navigator.serviceWorker.ready.then((reg) => {
        let mode = "test";

        reg.active.postMessage({
          cmd: "requestEncKeyPair",
          privateKey,
          publicKey,
          mode,
        });
      });
    }
  };

  const generatedPassword = async () => {
    if (isPassphraseMode === false && encryptionMethod === "secretKey") {
      let generated = await generatePassword();
      password = generated;
      setPassword(generated);
      setShortPasswordError(false);
    }else if (isPassphraseMode === true && encryptionMethod === "secretKey") {
      let generated = await generatePassPhrase();
      password = generated;
      setPassword(generated);
      setShortPasswordError(false);
    };
  }

  const handleFilesInput = (selectedFiles) => {
    selectedFiles = Array.from(selectedFiles);
    if (files.length > 0) {
      files = files.concat(selectedFiles);
      files = files.filter(
        (thing, index, self) =>
          index ===
          self.findIndex((t) => t.name === thing.name && t.size === thing.size)
      );
    } else {
      files = selectedFiles;
    }
    setFiles(files);
    updateTotalFilesSize();
  };

  const updateFilesInput = (index) => {
    files = [...files.slice(0, index), ...files.slice(index + 1)];
    setFiles(files);
    updateTotalFilesSize();
  };

  const resetFilesInput = () => {
    files = [];
    setFiles(files);
    setSumFilesSizes(0);
  };

  const updateTotalFilesSize = () => {
    if (files) {
      let sum = files.reduce(function (prev, current) {
        return prev + current.size;
      }, 0);

      setSumFilesSizes(sum);
    }
  };

  const handlePasswordInput = (selectedPassword) => {
    password = selectedPassword;
    setPassword(selectedPassword);
  };

  const handlePublicKeyInput = (selectedKey) => {
    setPublicKey(selectedKey);
    publicKey = selectedKey;
    setWrongPublicKey(false);
  };

  const loadPublicKey = (file) => {
    if (file) {
      if (file.size <= 1000000) {
        const reader = new FileReader();
        reader.readAsText(file);
        reader.onload = () => {
          setPublicKey(reader.result);
          publicKey = reader.result;
        };
        setWrongPublicKey(false);
      }
    }
  };

  const handlePrivateKeyInput = (selectedKey) => {
    setPrivateKey(selectedKey);
    privateKey = selectedKey;
    setWrongPrivateKey(false);
  };

  const loadPrivateKey = (file) => {
    if (file) {
      if (file.size <= 1000000) {
        const reader = new FileReader();
        reader.readAsText(file);
        reader.onload = () => {
          setPrivateKey(reader.result);
          privateKey = reader.result;
        };
        setWrongPrivateKey(false);
      }
    }
  };

  const handleEncryptedFilesDownload = async (e) => {
    numberOfFiles = Files.length;
    prepareFile();
  };

  const prepareFile = () => {
    let fileName = encodeURIComponent(files[currFile].name + ".enc");
    navigator.serviceWorker.ready.then((reg) => {
      reg.active.postMessage({ cmd: "prepareFileNameEnc", fileName });
    });
  };

  const kickOffEncryption = async () => {
    if (currFile <= numberOfFiles - 1) {
      file = files[currFile];
      triggerDownloadStream();
      setIsDownloading(true);

      if (encryptionMethodState === "publicKey") {
        navigator.serviceWorker.ready.then((reg) => {
          let mode = "derive";

          reg.active.postMessage({
            cmd: "requestEncKeyPair",
            privateKey,
            publicKey,
            mode,
          });
        });
      }

      if (encryptionMethodState === "secretKey") {
        navigator.serviceWorker.ready.then((reg) => {
          reg.active.postMessage({ cmd: "requestEncryption", password });
        });
      }
    }
  };

  const removeDownloadFrame = () => {
    if (typeof document === "undefined") return;
    const existing = document.getElementById("hatsmith-download-frame");
    if (existing) {
      existing.remove();
    }
  };

  const triggerDownloadStream = () => {
    if (typeof document === "undefined") return;

    removeDownloadFrame();

    const iframe = document.createElement("iframe");
    iframe.id = "hatsmith-download-frame";
    iframe.style.display = "none";
    iframe.src = `/file?stream=${Date.now()}`;
    document.body.appendChild(iframe);
  };

  const startEncryption = (method) => {
    navigator.serviceWorker.ready.then((reg) => {
      file
        .slice(0, CHUNK_SIZE)
        .arrayBuffer()
        .then((chunk) => {
          index = CHUNK_SIZE;

          if (method === "secretKey") {
            reg.active.postMessage(
              { cmd: "encryptFirstChunk", chunk, last: index >= file.size },
              [chunk]
            );
          }
          if (method === "publicKey") {
            reg.active.postMessage(
              {
                cmd: "asymmetricEncryptFirstChunk",
                chunk,
                last: index >= file.size,
              },
              [chunk]
            );
          }
        });
    });
  };

  const continueEncryption = (e) => {
    navigator.serviceWorker.ready.then((reg) => {
      file
        .slice(index, index + CHUNK_SIZE)
        .arrayBuffer()
        .then((chunk) => {
          index += CHUNK_SIZE;
          e.source.postMessage(
            { cmd: "encryptRestOfChunks", chunk, last: index >= file.size },
            [chunk]
          );
        });
    });
  };

  const createShareableLink = async () => {
    let pk = await computePublicKey(PrivateKey);
    let link = window.location.origin + "/?tab=decryption&publicKey=" + pk;
    setShareableLink(link);
  };

  useEffect(() => {
    const pingSW = setInterval(() => {
      navigator.serviceWorker.ready.then((reg) => {
        reg.active.postMessage({
          cmd: "pingSW",
        });
      });
    }, 15000);
    return () => clearInterval(pingSW);
  }, []);

  useEffect(() => {
    if (query.tab === "encryption" && query.publicKey) {
      setPublicKey(query.publicKey);
      publicKey = query.publicKey;
      setPkAlert(true);
      setEncryptionMethod("publicKey");
      encryptionMethodState = "publicKey";
    }
  }, [query.publicKey, query.tab]);

  useEffect(() => {
    const messageHandler = (e) => {
      switch (e.data.reply) {
        case "goodKeyPair":
          setActiveStep(2);
          break;
        case "wrongPrivateKey":
          setWrongPrivateKey(true);
          break;
        case "wrongPublicKey":
          setWrongPublicKey(true);
          break;
        case "wrongKeyPair":
          setKeysError(true);
          setKeysErrorMessage(t("invalid_key_pair"));
          break;
        case "wrongKeyInput":
          setKeysError(true);
          setKeysErrorMessage(t("invalid_keys_input"));
          break;
        case "keysGenerated":
          startEncryption("secretKey");
          break;
        case "keyPairReady":
          startEncryption("publicKey");
          break;
        case "filePreparedEnc":
          kickOffEncryption();
          break;
        case "continueEncryption":
          continueEncryption(e);
          break;
        case "encryptionFinished":
          if (numberOfFiles > 1) {
            updateCurrFile();
            file = null;
            index = null;
            if (currFile <= numberOfFiles - 1) {
              setTimeout(function () {
                prepareFile();
              }, 1000);
            } else {
              setIsDownloading(false);
              removeDownloadFrame();
              handleNext();
            }
          } else {
            setIsDownloading(false);
            removeDownloadFrame();
            handleNext();
          }
          break;
        case "workerError":
          setIsDownloading(false);
          removeDownloadFrame();
          break;
      }
    };
    navigator.serviceWorker.addEventListener("message", messageHandler);
    return () => navigator.serviceWorker.removeEventListener("message", messageHandler);
  }, []);

  const [selectedFile, setSelectedFile] = useState(null);
  const [showInfo, setShowInfo] = useState(false);

  const handleOpenInfo = (file) => {
    setSelectedFile(file);
    setShowInfo(true);
  };

  const handleCloseInfo = () => {
    setShowInfo(false);
    setSelectedFile(null);
  };

  return (
    <Box sx={{ width: "100%" }} {...getRootProps()}>
      <Snackbar
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        open={snackBarOpen}
        autoHideDuration={2000}
        onClose={showSnackBar}
      >
        <Alert severity="success">
          {snackBarMessage}
        </Alert>
      </Snackbar>
      <Backdrop open={isDragActive} sx={{ zIndex: 10 }}>
        <Typography
          variant="h2"
          gutterBottom
          sx={{ color: "#fff", textAlign: "center" }}
        >
          <img
            src="/assets/images/logo_new.png"
            width="100"
            height="100"
            alt="hat.sh logo"
          />
          <br />
          {t("drop_file_enc")}
        </Typography>
      </Backdrop>

      <Collapse in={pkAlert} sx={{ marginTop: '5px' }}>
        <Alert
          severity="success"
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => {
                setPkAlert(false);
              }}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
        >
          {t("recipient_key_loaded")}
        </Alert>
      </Collapse>

      <Stepper
        activeStep={activeStep}
        orientation="vertical"
        sx={{
          color: (theme) => getCustom(theme).mineShaft.main,
          backgroundColor: "transparent",
          '& .MuiStepIcon-root': {
            '&.Mui-active': {
              color: (theme) => getCustom(theme).emperor.main,
            },
            '&.Mui-completed': {
              color: (theme) => getCustom(theme).emperor.main,
            },
          }
        }}
      >
        <Step key={1}>
          <StepLabel>{t("choose_files_enc")}</StepLabel>
          <StepContent>
            <Box className="wrapper p-3" id="encFileWrapper">
              <Box
                id="encFileArea"
                sx={{
                  padding: "20px",
                  border: "5px dashed",
                  borderColor: (theme) => getCustom(theme).gallery.main,
                  borderRadius: "14px",
                  marginBottom: "10px",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  display: Files.length > 0 ? "block" : "flex"
                }}
              >
                <Paper elevation={0} sx={{
                  marginBottom: '15px',
                  overflow: "auto",
                  maxHeight: "280px",
                  backgroundColor: "transparent",
                }}>
                  <List dense={true} sx={{
                    display: "flex",
                    flex: "1",
                    flexWrap: "wrap",
                    alignContent: "center",
                    justifyContent: "center",
                  }}>
                    {Files.length > 0
                      ? Files.map((file, index) => (
                          <ListItem
                            key={index}
                            sx={{
                              backgroundColor: "#f3f3f3",
                              borderRadius: "8px",
                              padding: '15px',
                              marginBottom: '5px'
                            }}
                          >
                            <ListItemText
                              sx={{
                                width: "100px",
                                maxWidth: "150px",
                                minHeight: "50px",
                                maxHeight: "50px",
                              }}
                              primary={file.name}
                              secondary={formatBytes(file.size)}
                            />
                            <ListItemSecondaryAction>
                              <IconButton
                                sx={{ marginTop: '40px' }}
                                onClick={() => handleOpenInfo(file)}
                                edge="end"
                                aria-label="info"
                              >
                                <InfoIcon />
                              </IconButton>
                              <IconButton
                                sx={{ marginTop: '40px' }}
                                onClick={() => updateFilesInput(index)}
                                edge="end"
                                aria-label="delete"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))
                      : t("drag_drop_files")}
                  </List>
                </Paper>
                
                <input
                  id="enc-file"
                  type="file"
                  style={{ display: 'none' }}
                  onChange={(e) => handleFilesInput(e.target.files)}
                  multiple
                />
                <label htmlFor="enc-file">
                  <Button
                    sx={{
                      padding: '8px',
                      paddingLeft: '15px',
                      paddingRight: '15px',
                      textTransform: "none",
                      borderRadius: "8px",
                      border: "none",
                      color: (theme) => getCustom(theme).mineShaft.main,
                      backgroundColor: (theme) => getCustom(theme).alto.light,
                      "&:hover": {
                        backgroundColor: (theme) => getCustom(theme).alto.main,
                      },
                      transition: "background-color 0.2s ease-out, color .01s",
                    }}
                    component="span"
                    startIcon={
                      Files.length > 0 ? <AddIcon /> : <DescriptionIcon />
                    }
                  >
                    {Files.length > 0 ? t("add_files") : t("browse_files")}
                  </Button>
                </label>

                {Files.length > 0 && (
                  <>
                    <Button
                      onClick={() => resetFilesInput()}
                      sx={{
                        marginLeft: '8px',
                        padding: '8px',
                        paddingLeft: '15px',
                        paddingRight: '15px',
                        textTransform: "none",
                        borderRadius: "8px",
                        border: "none",
                        color: (theme) => getCustom(theme).flower.text,
                        backgroundColor: (theme) => getCustom(theme).flower.main,
                        "&:hover": {
                          backgroundColor: (theme) => getCustom(theme).flower.light,
                        },
                        transition: "background-color 0.2s ease-out, color .01s",
                      }}
                      component="span"
                      startIcon={<RotateLeftIcon />}
                    >
                      {t("reset")}
                    </Button>

                    <Box component="small" sx={{
                      float: "right",
                      marginTop: '15px',
                      textTransform: "none",
                      color: (theme) => getCustom(theme).cottonBoll.text,
                      transition: "background-color 0.2s ease-out, color .01s",
                    }}>
                      {Files.length} {Files.length > 1 ? t("files") : t("file")}
                      {Files.length > 1 && <>, {formatBytes(sumFilesSizes)}</>}
                    </Box>
                  </>
                )}
              </Box>
              <FileInfoDialog file={selectedFile} display={showInfo} onClose={handleCloseInfo} />
            </Box>

            <Box sx={{ marginBottom: (theme) => theme.spacing(2) }}>
              <div>
                <Button
                  fullWidth
                  disabled={Files.length === 0}
                  variant="contained"
                  onClick={handleNext}
                  sx={{
                    marginTop: (theme) => theme.spacing(1),
                    marginRight: (theme) => theme.spacing(1),
                    borderRadius: "8px",
                    backgroundColor: (theme) => theme.palette.primary.main,
                    color: (theme) => getCustom(theme).white.main,
                    "&:hover": {
                      backgroundColor: (theme) => getCustom(theme).mineShaft.main,
                    },
                    transition: "color .01s",
                  }}
                  className="nextBtnHs submitFile"
                >
                  {t("next")}
                </Button>
              </div>
            </Box>

            <Typography sx={{
              fontSize: 12,
              float: "right",
              color: (theme) => getCustom(theme).diamondBlack.main,
            }}>
              {t("offline_note")}
            </Typography>
          </StepContent>
        </Step>

        <Step key={2}>
          <StepLabel>
            {encryptionMethod !== "secretKey"
              ?  t("enter_keys_enc") : isPassphraseMode ? t("enter_passphrase") :  t("enter_password_enc") }
          </StepLabel>

          <StepContent>
            <FormControl
              component="fieldset"
              sx={{ float: "right", marginBottom: "15px" }}
            >
              <RadioGroup
                row
                value={encryptionMethod+((encryptionMethod === "secretKey" && isPassphraseMode)?"2":"")}
                aria-label="encryption options"
              >
                <FormControlLabel
                  value="secretKey"
                  control={<Radio color="default" />}
                  label={t("password")}
                  labelPlacement="end"
                  onChange={() => handleRadioChange("secretKey")}
                />
                <FormControlLabel
                  value="secretKey2"
                  control={<Radio color="default" />}
                  label={t("passphrase")}
                  labelPlacement="end"
                  onChange={() => handleRadioChange("secretKey2")}
                />
                <FormControlLabel
                  value="publicKey"
                  className="publicKeyInput"
                  control={<Radio color="default" />}
                  label={t("public_key")}
                  labelPlacement="end"
                  onChange={() => handleRadioChange("publicKey")}
                />
              </RadioGroup>
            </FormControl>

            {(encryptionMethod === "secretKey" || encryptionMethod === "secretKey2") && (
              <TextField
                required
                error={shortPasswordError ? true : false}
                type={showPassword ? "text" : "password"}
                id="encPasswordInput"
                label={t("required")}
                placeholder={t("password")}
                helperText={
                  Password ? (
                    <Tooltip
                      title={`${t("crackTimeEstimation")} ${
                        passwordStrengthCheck(Password)[1]
                      }`}
                      placement="right"
                      arrow
                    >
                      <span>
                        {t("password_strength")}
                        {": "}
                        <strong>{passwordStrengthCheck(Password)[0]}</strong>
                      </span>
                    </Tooltip>
                  ) : (
                    t("choose_strong_password")
                  )
                }
                variant="outlined"
                value={Password ? Password : ""}
                onChange={(e) => handlePasswordInput(e.target.value)}
                fullWidth
                InputProps={{
                  endAdornment: (
                    <>
                      {Password && (
                        <Tooltip title={t("show_password")} placement="left">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <Visibility /> : <VisibilityOff />}
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title={t("generate_password")} placement="left">
                        <IconButton
                          onClick={generatedPassword}
                          className="generatePasswordBtn"
                        >
                          <CachedIcon />
                        </IconButton>
                      </Tooltip>
                    </>
                  ),
                }}
              />
            )}

            {encryptionMethod === "publicKey" && (
              <>
                <TextField
                  id="public-key-input"
                  required
                  error={wrongPublicKey ? true : false}
                  label={
                    wrongPublicKey ? t("error") : t("recipient_public_key")
                  }
                  helperText={wrongPublicKey ? t("wrong_public_key") : ""}
                  placeholder={t("enter_recipient_public_key")}
                  variant="outlined"
                  value={PublicKey ? PublicKey : ""}
                  onChange={(e) => handlePublicKeyInput(e.target.value)}
                  fullWidth
                  sx={{ marginBottom: "15px" }}
                  InputProps={{
                    endAdornment: (
                      <>
                        <input
                          accept=".public"
                          style={{ display: 'none' }}
                          id="public-key-file"
                          type="file"
                          onChange={(e) => loadPublicKey(e.target.files[0])}
                        />
                        <label htmlFor="public-key-file">
                          <Tooltip
                            title={t("load_public_key")}
                            placement="left"
                          >
                            <IconButton
                              aria-label={t("load_public_key")}
                              component="span"
                            >
                              <AttachFileIcon />
                            </IconButton>
                          </Tooltip>
                        </label>
                      </>
                    ),
                  }}
                />

                <TextField
                  id="private-key-input"
                  type={showPrivateKey ? "text" : "password"}
                  required
                  error={wrongPrivateKey ? true : false}
                  label={
                    wrongPrivateKey ? t("error") : t("your_private_key_enc")
                  }
                  helperText={wrongPrivateKey ? t("wrong_private_key") : ""}
                  placeholder={t("enter_private_key_enc")}
                  variant="outlined"
                  value={PrivateKey ? PrivateKey : ""}
                  onChange={(e) => handlePrivateKeyInput(e.target.value)}
                  fullWidth
                  sx={{ marginBottom: "15px" }}
                  InputProps={{
                    endAdornment: (
                      <>
                        {PrivateKey && (
                          <Tooltip
                            title={t("show_private_key")}
                            placement="left"
                          >
                            <IconButton
                              onClick={() => setShowPrivateKey(!showPrivateKey)}
                            >
                              {showPrivateKey ? (
                                <Visibility />
                              ) : (
                                <VisibilityOff />
                              )}
                            </IconButton>
                          </Tooltip>
                        )}

                        <input
                          accept=".private"
                          style={{ display: 'none' }}
                          id="private-key-file"
                          type="file"
                          onChange={(e) => loadPrivateKey(e.target.files[0])}
                        />
                        <label htmlFor="private-key-file">
                          <Tooltip
                            title={t("load_private_key")}
                            placement="left"
                          >
                            <IconButton
                              aria-label={t("load_private_key")}
                              component="span"
                            >
                              <AttachFileIcon />
                            </IconButton>
                          </Tooltip>
                        </label>
                      </>
                    ),
                  }}
                />

                <KeyPairGeneration />
              </>
            )}

            <Box sx={{ marginBottom: (theme) => theme.spacing(2), marginTop: '15px' }}>
              <div>
                <Grid container spacing={1}>
                  <Grid item>
                    <Button
                      disabled={activeStep === 0}
                      onClick={handleBack}
                      sx={{
                        marginTop: (theme) => theme.spacing(1),
                        marginRight: (theme) => theme.spacing(1),
                        borderRadius: "8px",
                        backgroundColor: (theme) => getCustom(theme).mercury.main,
                        transition: "color .01s",
                      }}
                      fullWidth
                    >
                      {t("back")}
                    </Button>
                  </Grid>
                  <Grid item xs>
                    <Button
                      disabled={
                        (encryptionMethod === "secretKey" && !Password) ||
                        (encryptionMethod === "publicKey" &&
                          (!PublicKey || !PrivateKey))
                      }
                      variant="contained"
                      onClick={handleMethodStep}
                      sx={{
                        marginTop: (theme) => theme.spacing(1),
                        marginRight: (theme) => theme.spacing(1),
                        borderRadius: "8px",
                        backgroundColor: (theme) => theme.palette.primary.main,
                        color: (theme) => getCustom(theme).white.main,
                        "&:hover": {
                          backgroundColor: (theme) => getCustom(theme).mineShaft.main,
                        },
                        transition: "color .01s",
                      }}
                      className="nextBtnHs submitKeys"
                      fullWidth
                    >
                      {t("next")}
                    </Button>
                  </Grid>
                </Grid>
                <br />

                {encryptionMethod === "publicKey" && keysError && (
                  <Alert severity="error">{keysErrorMessage}</Alert>
                )}

                {encryptionMethod === "secretKey" && shortPasswordError && (
                  <Alert severity="error">{t("short_password")}</Alert>
                )}
              </div>
            </Box>
          </StepContent>
        </Step>

        <Step key={3}>
          <StepLabel>{t("download_encrypted_files")}</StepLabel>
          <StepContent>
            {Files.length > 0 && (
              <Alert severity="success" icon={<LockOutlinedIcon />}>
                <strong>
                  {Files.length > 1 ? Files.length : Files[0].name}
                </strong>{" "}
                {Files.length > 1
                  ? t("files_ready_to_download")
                  : t("ready_to_download")}
              </Alert>
            )}

            <Box sx={{ marginBottom: (theme) => theme.spacing(2) }}>
              <Grid container spacing={1}>
                <Grid item>
                  <Button
                    disabled={activeStep === 0 || isDownloading}
                    onClick={handleBack}
                    sx={{
                      marginTop: (theme) => theme.spacing(1),
                      marginRight: (theme) => theme.spacing(1),
                      borderRadius: "8px",
                      backgroundColor: (theme) => getCustom(theme).mercury.main,
                      transition: "color .01s",
                    }}
                  >
                    {t("back")}
                  </Button>
                </Grid>
                <Grid item xs>
                  <Button
                    disabled={
                      isDownloading ||
                      (!Password && !PublicKey && !PrivateKey) ||
                      Files.length === 0
                    }
                    variant="contained"
                    sx={{
                      marginTop: (theme) => theme.spacing(1),
                      marginRight: (theme) => theme.spacing(1),
                      borderRadius: "8px",
                      backgroundColor: (theme) => theme.palette.primary.main,
                      color: (theme) => getCustom(theme).white.main,
                      "&:hover": {
                        backgroundColor: (theme) => getCustom(theme).mineShaft.main,
                      },
                      transition: "color .01s",
                    }}
                    className="nextBtnHs"
                    startIcon={
                      isDownloading ? (
                        <CircularProgress
                          size={24}
                        />
                      ) : (
                        <GetAppIcon />
                      )
                    }
                    fullWidth
                    onClick={(e) => handleEncryptedFilesDownload(e)}
                  >
                    <Box component="span" className="downloadFile" sx={{
                        width: "100%",
                        textDecoration: "none",
                        color: 'inherit'
                      }}>
                      {isDownloading
                        ? `${currFileState + 1}/${numberOfFiles} ${t(
                            "downloading_file"
                          )}`
                        : t("encrypted_files")}
                    </Box>
                  </Button>
                </Grid>
              </Grid>
              <br />

              {isDownloading && (
                <Alert variant="outlined" severity="info">
                  {t("page_close_alert")}
                </Alert>
              )}
            </Box>
          </StepContent>
        </Step>
      </Stepper>
      {activeStep === 3 && (
        <Paper elevation={0} sx={{
          padding: (theme) => theme.spacing(3),
          boxShadow: "rgba(149, 157, 165, 0.4) 0px 8px 24px",
          borderRadius: "8px",
        }}>
          <Alert
            variant="outlined"
            severity="success"
            sx={{ border: "none" }}
          >
            <AlertTitle>{t("success")}</AlertTitle>
            {t("success_downloaded_files_enc")}
            {encryptionMethod === "publicKey" && (
              <>
                <br />
                <br />
                <ul>
                  <li>{t("after_enc_note_one")}</li>
                  <li>{t("after_enc_note_two")}</li>
                </ul>
              </>
            )}
          </Alert>

          <Grid container spacing={1}>
            {encryptionMethod === "secretKey" && (
              <Grid item xs={12} sm={6}>
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(Password);
                    setSnackBarMessage(t("password_copied"));
                    showSnackBar();
                  }}
                  sx={{
                    marginTop: (theme) => theme.spacing(1),
                    marginRight: (theme) => theme.spacing(1),
                    borderRadius: "8px",
                    border: "none",
                    color: (theme) => getCustom(theme).mineShaft.main,
                    backgroundColor: (theme) => getCustom(theme).mercury.light,
                    "&:hover": {
                      backgroundColor: (theme) => getCustom(theme).mercury.main,
                    },
                    transition: "background-color 0.2s ease-out, color .01s",
                    textTransform: "none"
                  }}
                  className="copyPassword"
                  variant="outlined"
                  startIcon={<FileCopyIcon />}
                  fullWidth
                >
                  {t("copy_password")}
                </Button>
              </Grid>
            )}

            {encryptionMethod === "publicKey" && (
              <Grid item xs={12} sm={6}>
                <Tooltip
                  title={t("create_shareable_link_tooltip")}
                  placement="bottom"
                >
                  <Button
                    onClick={() => createShareableLink()}
                    sx={{
                      marginTop: (theme) => theme.spacing(1),
                      marginRight: (theme) => theme.spacing(1),
                      borderRadius: "8px",
                      border: "none",
                      color: (theme) => getCustom(theme).mineShaft.main,
                      backgroundColor: (theme) => getCustom(theme).mercury.light,
                      "&:hover": {
                        backgroundColor: (theme) => getCustom(theme).mercury.main,
                      },
                      transition: "background-color 0.2s ease-out, color .01s",
                      textTransform: "none"
                    }}
                    variant="outlined"
                    startIcon={<LinkIcon />}
                    fullWidth
                  >
                    {t("create_shareable_link")}
                  </Button>
                </Tooltip>
              </Grid>
            )}

            <Grid item xs={12} sm={6}>
              <Button
                onClick={handleReset}
                sx={{
                  marginTop: (theme) => theme.spacing(1),
                  marginRight: (theme) => theme.spacing(1),
                  borderRadius: "8px",
                  border: "none",
                  color: (theme) => getCustom(theme).mineShaft.main,
                  backgroundColor: (theme) => getCustom(theme).mercury.light,
                  "&:hover": {
                    backgroundColor: (theme) => getCustom(theme).mercury.main,
                  },
                  transition: "background-color 0.2s ease-out, color .01s",
                  textTransform: "none"
                }}
                variant="outlined"
                startIcon={<RefreshIcon />}
                fullWidth
              >
                {t("encrypt_more_files")}
              </Button>
            </Grid>

            {encryptionMethod === "publicKey" && shareableLink && (
              <TextField
                sx={{ marginTop: '15px' }}
                defaultValue={shareableLink}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <>
                      <Tooltip title={t("copy_link")} placement="left">
                        <IconButton
                          onClick={() => {
                            navigator.clipboard.writeText(shareableLink);
                            setSnackBarMessage(
                              t("create_shareable_link_copied")
                            );
                            showSnackBar();
                          }}
                        >
                          <FileCopyIcon />
                        </IconButton>
                      </Tooltip>
                    </>
                  ),
                }}
                helperText={t("create_shareable_link_note")}
                variant="outlined"
                fullWidth
              />
            )}
          </Grid>
        </Paper>
      )}
    </Box>
  );
}

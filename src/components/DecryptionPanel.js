import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { useDropzone } from "react-dropzone";
import { formatBytes } from "../helpers/formatBytes";
import { formatName } from "../helpers/formatName";
import {
  crypto_secretstream_xchacha20poly1305_ABYTES,
  CHUNK_SIZE,
} from "../config/Constants";
import { Alert, AlertTitle, Box, Grid, Stepper, Step, StepLabel, StepContent, Button, Paper, Typography, CircularProgress, TextField, IconButton, Tooltip, Backdrop, Collapse, List, ListItem, ListItemSecondaryAction, ListItemText } from "@mui/material";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import RefreshIcon from "@mui/icons-material/Refresh";
import DescriptionIcon from "@mui/icons-material/Description";
import GetAppIcon from "@mui/icons-material/GetApp";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import RotateLeftIcon from "@mui/icons-material/RotateLeft";
import DeleteIcon from "@mui/icons-material/Delete";
import InfoIcon from "@mui/icons-material/Info";
import FileInfoDialog from "./FileInfoDialog.jsx";
import { getTranslations as t } from "../../locales";
import { getCustom } from "../config/Theme";

let file,
  index,
  decFileBuff,
  files = [],
  password,
  currFile = 0,
  numberOfFiles,
  decryptionMethodState,
  privateKey,
  publicKey;
const DOWNLOAD_WINDOW_NAME = "hatsmith-download-window";

export default function DecryptionPanel() {
  const router = useRouter();
  const query = router.query;

  const [activeStep, setActiveStep] = useState(0);
  const [Files, setFiles] = useState([]);
  const [currFileState, setCurrFileState] = useState(0);
  const [Password, setPassword] = useState();
  const [decryptionMethod, setDecryptionMethod] = useState("secretKey");
  const [PublicKey, setPublicKey] = useState();
  const [PrivateKey, setPrivateKey] = useState();
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [wrongPublicKey, setWrongPublicKey] = useState(false);
  const [wrongPrivateKey, setWrongPrivateKey] = useState(false);
  const [keysError, setKeysError] = useState(false);
  const [keysErrorMessage, setKeysErrorMessage] = useState();
  const [badFile, setbadFile] = useState();
  const [oldVersion, setOldVersion] = useState();
  const [fileMixUp, setFileMixUp] = useState(false);
  const [wrongPassword, setWrongPassword] = useState(false);
  const [isCheckingFile, setIsCheckingFile] = useState(false);
  const [isTestingPassword, setIsTestingPassword] = useState(false);
  const [isTestingKeys, setIsTestingKeys] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [pkAlert, setPkAlert] = useState(false);

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
    setWrongPassword(false);
    setWrongPublicKey(false);
    setWrongPrivateKey(false);
    setKeysError(false);
    setIsTestingKeys(false);
    setIsTestingPassword(false);
  };

  const handleReset = () => {
    setActiveStep(0);
    setFiles([]);
    setPassword();
    setWrongPassword(false);
    setbadFile(false);
    setOldVersion(false);
    setFileMixUp(false);
    setPublicKey();
    setPrivateKey();
    privateKey = null;
    publicKey = null;
    setWrongPublicKey(false);
    setWrongPrivateKey(false);
    setKeysError(false);
    setPkAlert(false);
    file = null;
    index = null;
    files = [];
    numberOfFiles = 0;
    resetCurrFile();
    router.replace(router.pathname);
  };

  const resetCurrFile = () => {
    currFile = 0;
    setCurrFileState(currFile);
  };

  const updateCurrFile = () => {
    currFile += 1;
    setCurrFileState(currFile);
  };

  const resetFileErrors = () => {
    setbadFile(false);
    setOldVersion(false);
    setFileMixUp(false);
    resetCurrFile();
    decryptionMethodState = null;
  };

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
    resetFileErrors();
  };

  const updateFilesInput = (index) => {
    files = [...files.slice(0, index), ...files.slice(index + 1)];
    setFiles(files);
    resetFileErrors();
  };

  const resetFilesInput = () => {
    files = [];
    setFiles(files);
    resetFileErrors();
  };

  const handlePasswordInput = (selectedPassword) => {
    setPassword(selectedPassword);
    password = selectedPassword;
    setWrongPassword(false);
  };

  const checkFile = (file) => {
    navigator.serviceWorker.ready.then((reg) => {
      setIsCheckingFile(true);
      setbadFile(false);
      setOldVersion(false);
      setFileMixUp(false);

      Promise.all([
        file.slice(0, 11).arrayBuffer(), //signatures
        file.slice(0, 22).arrayBuffer(), //v1 signature
      ]).then(([signature, legacy]) => {
        reg.active.postMessage({
          cmd: "checkFile",
          signature,
          legacy,
        });
      });
    });
  };

  const checkFiles = () => {
    numberOfFiles = files.length;
    if (currFile <= numberOfFiles - 1) {
      checkFile(files[currFile]);
    }
  };

  const checkFilesQueue = () => {
    if (numberOfFiles > 1) {
      updateCurrFile();

      if (currFile <= numberOfFiles - 1) {
        checkFiles();
      } else {
        setActiveStep(1);
        setIsCheckingFile(false);
        resetCurrFile();
      }
    }
  };

  const checkFileMixUp = () => {
    setFileMixUp(true);
    setIsCheckingFile(false);
  };

  const checkFilesTestQueue = () => {
    if (numberOfFiles > 1) {
      updateCurrFile();

      if (currFile <= numberOfFiles - 1) {
        testFilesDecryption();
      } else {
        setIsTestingKeys(false);
        setIsTestingPassword(false);
        handleNext();
        resetCurrFile();
      }
    }
  };

  const testFilesDecryption = () => {
    numberOfFiles = files.length;
    if (currFile <= numberOfFiles - 1) {
      testDecryption(files[currFile]);
    }
  };

  const testDecryption = (file) => {
    if (decryptionMethodState === "secretKey") {
      navigator.serviceWorker.ready.then((reg) => {
        setIsTestingPassword(true);
        setWrongPassword(false);

        Promise.all([
          file.slice(0, 11).arrayBuffer(), //signature
          file.slice(11, 27).arrayBuffer(), //salt
          file.slice(27, 51).arrayBuffer(), //header
          file
            .slice(
              51,
              51 + CHUNK_SIZE + crypto_secretstream_xchacha20poly1305_ABYTES
            )
            .arrayBuffer(), //17
        ]).then(([signature, salt, header, chunk]) => {
          decFileBuff = chunk; //for testing the dec password
          reg.active.postMessage({
            cmd: "requestTestDecryption",
            password,
            signature,
            salt,
            header,
            decFileBuff,
          });
        });
      });
    }

    if (decryptionMethodState === "publicKey") {
      navigator.serviceWorker.ready.then((reg) => {
        setIsTestingKeys(true);
        setKeysError(false);
        setWrongPrivateKey(false);
        setWrongPublicKey(false);

        let mode = "test";

        Promise.all([
          file.slice(11, 35).arrayBuffer(), //header
          file
            .slice(
              35,
              35 + CHUNK_SIZE + crypto_secretstream_xchacha20poly1305_ABYTES
            )
            .arrayBuffer(), //17
        ]).then(([header, chunk]) => {
          decFileBuff = chunk;
          reg.active.postMessage({
            cmd: "requestDecKeyPair",
            privateKey,
            publicKey,
            header,
            decFileBuff,
            mode,
          });
        });
      });
    }
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
      }
    }
  };

  const handleEncryptedFilesDownload = async (e) => {
    if (typeof window !== "undefined") {
      const downloadWindow = window.open("about:blank", DOWNLOAD_WINDOW_NAME);
      if (downloadWindow) {
        downloadWindow.document.title = "Preparing decrypted download...";
        downloadWindowRef.current = downloadWindow;
      }
    }

    numberOfFiles = Files.length;
    prepareFile();
  };

  const prepareFile = () => {
    let fileName = encodeURIComponent(formatName(files[currFile].name));
    navigator.serviceWorker.ready.then((reg) => {
      reg.active.postMessage({ cmd: "prepareFileNameDec", fileName });
    });
  };

  const kickOffDecryption = async (e) => {
    if (currFile <= numberOfFiles - 1) {
      file = files[currFile];
      triggerDownloadStream();
      setIsDownloading(true);

      if (decryptionMethodState === "secretKey") {
        navigator.serviceWorker.ready.then((reg) => {
          Promise.all([
            file.slice(0, 11).arrayBuffer(), //signature
            file.slice(11, 27).arrayBuffer(), //salt
            file.slice(27, 51).arrayBuffer(), //header
            file
              .slice(
                51,
                51 + CHUNK_SIZE + crypto_secretstream_xchacha20poly1305_ABYTES
              )
              .arrayBuffer(), //17
          ]).then(([signature, salt, header, chunk]) => {
            reg.active.postMessage({
              cmd: "requestDecryption",
              password,
              signature,
              salt,
              header,
            });
          });
        });
      }

      if (decryptionMethodState === "publicKey") {
        navigator.serviceWorker.ready.then((reg) => {
          let mode = "derive";

          Promise.all([
            file.slice(11, 35).arrayBuffer(), //header
            file
              .slice(
                35,
                35 + CHUNK_SIZE + crypto_secretstream_xchacha20poly1305_ABYTES
              )
              .arrayBuffer(), //17
          ]).then(([header, chunk]) => {
            decFileBuff = chunk;
            reg.active.postMessage({
              cmd: "requestDecKeyPair",
              privateKey,
              publicKey,
              header,
              decFileBuff,
              mode,
            });
          });
        });
      }
    }
  };

  const triggerDownloadStream = () => {
    const streamUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/file?stream=${Date.now()}`
        : `/file?stream=${Date.now()}`;

    if (typeof window !== "undefined") {
      downloadWindowRef.current = window.open(streamUrl, DOWNLOAD_WINDOW_NAME);
    }
  };

  const startDecryption = (method) => {
    let startIndex;
    if (method === "secretKey") startIndex = 51;
    if (method === "publicKey") startIndex = 35;

    file = files[currFile];

    navigator.serviceWorker.ready.then((reg) => {
      file
        .slice(
          startIndex,
          startIndex + CHUNK_SIZE + crypto_secretstream_xchacha20poly1305_ABYTES
        )
        .arrayBuffer()
        .then((chunk) => {
          index =
            startIndex +
            CHUNK_SIZE +
            crypto_secretstream_xchacha20poly1305_ABYTES;
          reg.active.postMessage(
            { cmd: "decryptFirstChunk", chunk, last: index >= file.size },
            [chunk]
          );
        });
    });
  };

  const continueDecryption = (e) => {
    file = files[currFile];

    navigator.serviceWorker.ready.then((reg) => {
      file
        .slice(
          index,
          index + CHUNK_SIZE + crypto_secretstream_xchacha20poly1305_ABYTES
        )
        .arrayBuffer()
        .then((chunk) => {
          index += CHUNK_SIZE + crypto_secretstream_xchacha20poly1305_ABYTES;
          e.source.postMessage(
            { cmd: "decryptRestOfChunks", chunk, last: index >= file.size },
            [chunk]
          );
        });
    });
  };

  useEffect(() => {
    if (query.tab === "decryption" && query.publicKey) {
      setPublicKey(query.publicKey);
      publicKey = query.publicKey;
      setPkAlert(true);
      setDecryptionMethod("publicKey");
      decryptionMethodState = "publicKey";
    }
  }, [query.publicKey, query.tab]);

  useEffect(() => {
    const messageHandler = (e) => {
      switch (e.data.reply) {
        case "badFile":
          if (numberOfFiles > 1) {
            setbadFile(files[currFile].name);
            setIsCheckingFile(false);
          } else {
            setbadFile(true);
            setIsCheckingFile(false);
          }
          break;
        case "oldVersion":
          if (numberOfFiles > 1) {
            setOldVersion(files[currFile].name);
            setIsCheckingFile(false);
          } else {
            setOldVersion(true);
            setIsCheckingFile(false);
          }
          break;
        case "secretKeyEncryption":
          if (numberOfFiles > 1) {
            if (
              decryptionMethodState &&
              decryptionMethodState !== "secretKey"
            ) {
              checkFileMixUp();
              return;
            } else {
              decryptionMethodState = "secretKey";
              setDecryptionMethod("secretKey");
              checkFilesQueue();
            }
          } else {
            setDecryptionMethod("secretKey");
            decryptionMethodState = "secretKey";
            setActiveStep(1);
            setIsCheckingFile(false);
            resetCurrFile();
          }
          break;
        case "publicKeyEncryption":
          if (numberOfFiles > 1) {
            if (
              decryptionMethodState &&
              decryptionMethodState !== "publicKey"
            ) {
              checkFileMixUp();
              return;
            } else {
              decryptionMethodState = "publicKey";
              setDecryptionMethod("publicKey");
              checkFilesQueue();
            }
          } else {
            setDecryptionMethod("publicKey");
            decryptionMethodState = "publicKey";
            setActiveStep(1);
            setIsCheckingFile(false);
            resetCurrFile();
          }
          break;
        case "wrongDecPrivateKey":
          setWrongPrivateKey(true);
          setIsTestingKeys(false);
          break;
        case "wrongDecPublicKey":
          setWrongPublicKey(true);
          setIsTestingKeys(false);
          break;
        case "wrongDecKeys":
          setWrongPublicKey(true);
          setWrongPrivateKey(true);
          setIsTestingKeys(false);
          break;
        case "wrongDecKeyPair":
          setKeysError(true);
          setKeysErrorMessage(t("invalid_key_pair"));
          setIsTestingKeys(false);
          break;
        case "wrongDecKeyInput":
          setKeysError(true);
          setKeysErrorMessage(t("invalid_keys_input"));
          setIsTestingKeys(false);
          break;
        case "wrongPassword":
          setWrongPassword(true);
          setIsTestingPassword(false);
          break;
        case "filePreparedDec":
          kickOffDecryption();
          break;
        case "readyToDecrypt":
          if (numberOfFiles > 1) {
            checkFilesTestQueue();
          } else {
            setIsTestingKeys(false);
            setIsTestingPassword(false);
            handleNext();
            resetCurrFile();
          }
          break;
        case "decKeyPairGenerated":
          startDecryption("publicKey");
          break;
        case "decKeysGenerated":
          startDecryption("secretKey");
          break;
        case "continueDecryption":
          continueDecryption(e);
          break;
        case "decryptionFinished":
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
              handleNext();
            }
          } else {
            setIsDownloading(false);
            handleNext();
          }
          break;
        case "workerError":
          setIsDownloading(false);
          break;
      }
    };
    navigator.serviceWorker.addEventListener("message", messageHandler);
    return () => navigator.serviceWorker.removeEventListener("message", messageHandler);
  }, []);

  const [selectedFile, setSelectedFile] = useState(null);
  const [showInfo, setShowInfo] = useState(false);
  const downloadWindowRef = useRef(null);

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
          {t("drop_file_dec")}
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
          {t("sender_key_loaded")}
        </Alert>
      </Collapse>

      <Stepper
        activeStep={activeStep}
        orientation="vertical"
        sx={{
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
          <StepLabel>{t("choose_files_dec")}</StepLabel>
          <StepContent>
            <Box className="wrapper p-3" id="decFileWrapper">
              <Box
                id="decFileArea"
                sx={{
                  padding: "20px",
                  border: "5px dashed",
                  borderColor: (theme) => getCustom(theme).gallery.main,
                  borderRadius: "14px",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  display: Files.length > 0 ? "block" : "flex",
                  marginBottom: "10px",
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
                  id="dec-file"
                  type="file"
                  style={{ display: 'none' }}
                  onChange={(e) => handleFilesInput(e.target.files)}
                  multiple
                />
                <label htmlFor="dec-file">
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
                    </Box>
                  </>
                )}
              </Box>
            </Box>

            <Box sx={{ marginBottom: (theme) => theme.spacing(2) }}>
              <div>
                <Button
                  disabled={isCheckingFile || Files.length === 0}
                  variant="contained"
                  onClick={checkFiles}
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
                  className="submitFileDec"
                  startIcon={
                    isCheckingFile && (
                      <CircularProgress
                        size={24}
                      />
                    )
                  }
                  fullWidth
                >
                  {isCheckingFile ? t("checking_file") : t("next")}
                </Button>
              </div>

              {badFile && (
                <Alert severity="error" sx={{ marginTop: '15px' }}>
                  {t("file_not_encrypted_corrupted")}
                  <br />
                  {Files.length > 1 ? <strong>{badFile}</strong> : ""}
                </Alert>
              )}

              {oldVersion && (
                <Alert severity="error" sx={{ marginTop: '15px' }}>
                  {t("old_version")}{" "}
                  <a href="https://v1.hat.sh/" target="_blank" rel="noreferrer">
                    {"https://v1.hat.sh"}
                  </a>
                  <br />
                  {Files.length > 1 ? <strong>{oldVersion}</strong> : ""}
                </Alert>
              )}

              {fileMixUp && (
                <Alert severity="error" sx={{ marginTop: '15px' }}>
                  {t("file_mixup")}
                </Alert>
              )}
            </Box>

            {!badFile && !oldVersion && !fileMixUp && (
              <Typography sx={{
                fontSize: 12,
                float: "right",
                color: (theme) => getCustom(theme).diamondBlack.main,
              }}>
                {t("offline_note")}
              </Typography>
            )}
            <FileInfoDialog file={selectedFile} display={showInfo} onClose={handleCloseInfo} />
          </StepContent>
        </Step>

        <Step key={2}>
          <StepLabel>
            {decryptionMethod === "secretKey"
              ? t("enter_password_dec")
              : t("enter_keys_dec")}
          </StepLabel>
          <StepContent>
            {decryptionMethod === "secretKey" && (
              <TextField
                required
                type={showPassword ? "text" : "password"}
                error={wrongPassword ? true : false}
                id={
                  wrongPassword
                    ? "outlined-error-helper-text"
                    : "outlined-required"
                }
                className="decPasswordInput"
                label={wrongPassword ? t("error") : t("required")}
                helperText={wrongPassword ? t("wrong_password") : ""}
                placeholder={t("password")}
                variant="outlined"
                value={Password ? Password : ""}
                onChange={(e) => handlePasswordInput(e.target.value)}
                fullWidth
                InputProps={{
                  endAdornment: (
                    <Tooltip title={t("show_password")} placement="left">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <Visibility /> : <VisibilityOff />}
                      </IconButton>
                    </Tooltip>
                  ),
                }}
              />
            )}

            {decryptionMethod === "publicKey" && (
              <>
                <TextField
                  id="public-key-input-dec"
                  required
                  error={wrongPublicKey || keysError ? true : false}
                  helperText={wrongPublicKey ? t("wrong_public_key") : ""}
                  label={t("sender_public_key")}
                  placeholder={t("enter_sender_public_key")}
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
                          id="dec-public-key-file"
                          type="file"
                          onChange={(e) => loadPublicKey(e.target.files[0])}
                        />
                        <label htmlFor="dec-public-key-file">
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
                  id="private-key-input-dec"
                  type={showPrivateKey ? "text" : "password"}
                  required
                  error={wrongPrivateKey || keysError ? true : false}
                  helperText={wrongPrivateKey ? t("wrong_private_key") : ""}
                  label={t("your_private_key_dec")}
                  placeholder={t("enter_private_key_dec")}
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
                          id="dec-private-key-file"
                          type="file"
                          onChange={(e) => loadPrivateKey(e.target.files[0])}
                        />
                        <label htmlFor="dec-private-key-file">
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
              </>
            )}

            <Box sx={{ marginBottom: (theme) => theme.spacing(2) }}>
              <div>
                <Grid container spacing={1}>
                  <Grid item>
                    <Button
                      disabled={
                        activeStep === 0 || isTestingPassword || isTestingKeys
                      }
                      onClick={handleBack}
                      sx={{
                        marginTop: (theme) => theme.spacing(1),
                        marginRight: (theme) => theme.spacing(1),
                        borderRadius: "8px",
                        backgroundColor: (theme) => getCustom(theme).mercury.main,
                      }}
                      fullWidth
                    >
                      {t("back")}
                    </Button>
                  </Grid>
                  <Grid item xs>
                    <Button
                      disabled={
                        (decryptionMethod === "secretKey" && !Password) ||
                        (decryptionMethod === "publicKey" &&
                          (!PublicKey || !PrivateKey)) ||
                        isTestingPassword ||
                        isTestingKeys
                      }
                      variant="contained"
                      onClick={testFilesDecryption}
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
                      className="submitKeysDec"
                      startIcon={
                        (isTestingPassword || isTestingKeys) && (
                          <CircularProgress
                            size={24}
                          />
                        )
                      }
                      fullWidth
                    >
                      {isTestingPassword
                        ? `${currFileState + 1}/${numberOfFiles} ${t(
                            "testing_password"
                          )}`
                        : isTestingKeys
                        ? `${currFileState + 1}/${numberOfFiles} ${t(
                            "testing_keys"
                          )}`
                        : t("next")}
                    </Button>
                  </Grid>
                </Grid>
                <br />

                {decryptionMethod === "secretKey" &&
                  Files.length > 1 &&
                  wrongPassword &&
                  !isTestingPassword && (
                    <Alert severity="error">
                      <strong>{Files[currFile].name}</strong>{" "}
                      {t("file_has_wrong_password")}
                    </Alert>
                  )}

                {decryptionMethod === "publicKey" && keysError && (
                  <Alert severity="error">{keysErrorMessage}</Alert>
                )}

                {decryptionMethod === "publicKey" &&
                  (wrongPrivateKey || wrongPublicKey) &&
                  !isTestingKeys &&
                  !keysError && (
                    <>
                      {Files.length > 1 && (
                        <Alert severity="error">
                          <strong>{Files[currFile].name}</strong>{" "}
                          {t("file_has_wrong_keys")}
                        </Alert>
                      )}
                    </>
                  )}
              </div>
            </Box>
          </StepContent>
        </Step>

        <Step key={3}>
          <StepLabel>{t("download_decrypted_files")}</StepLabel>

          <StepContent>
            {Files.length > 0 && (
              <Alert severity="success" icon={<LockOpenIcon />}>
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
                    <Box component="span" className="downloadFileDec" sx={{
                        width: "100%",
                        textDecoration: "none",
                        color: 'inherit'
                      }}>
                      {isDownloading
                        ? `${currFileState + 1}/${numberOfFiles} ${t(
                            "downloading_file"
                          )}`
                        : t("decrypted_files")}
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
        <Paper elevation={1} sx={{
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
            {t("success_downloaded_files_dec")}
          </Alert>

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
            {t("decrypt_other_files")}
          </Button>
        </Paper>
      )}
    </Box>
  );
}

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useDropzone } from "react-dropzone";
import { formatBytes } from "../helpers/formatBytes";
import { formatName } from "../helpers/formatName";
import {
  crypto_secretstream_xchacha20poly1305_ABYTES,
  CHUNK_SIZE,
} from "../config/Constants";
import { Alert, AlertTitle } from "@mui/material";
import Grid from "@mui/material/Grid";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import StepContent from "@mui/material/StepContent";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Backdrop from "@mui/material/Backdrop";
import Collapse from "@mui/material/Collapse";
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
import { getTranslations as t } from "../../locales";
import {
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import InfoIcon from "@mui/icons-material/Info";
import FileInfoDialog from "./FileInfoDialog";
import Box from "@mui/material/Box";

let file,
  files = [],
  password,
  index,
  currFile = 0,
  numberOfFiles,
  decryptionMethodState = "secretKey",
  privateKey,
  publicKey;

export default function DecryptionPanel() {
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

  const [wrongPassword, setWrongPassword] = useState(false);

  const [wrongPublicKey, setWrongPublicKey] = useState(false);

  const [wrongPrivateKey, setWrongPrivateKey] = useState(false);

  const [keysError, setKeysError] = useState(false);

  const [keysErrorMessage, setKeysErrorMessage] = useState();

  const [decryptionMethod, setDecryptionMethod] = useState("secretKey");

  const [isDownloading, setIsDownloading] = useState(false);

  const [isTestingPassword, setIsTestingPassword] = useState(false);

  const [isTestingKeys, setIsTestingKeys] = useState(false);

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
    resetCurrFile();
  };

  const handleRadioChange = (method) => {
    setDecryptionMethod(method);
    decryptionMethodState = method;
  };

  const handleReset = () => {
    setActiveStep(0);
    setFiles([]);
    setPassword();
    setPublicKey();
    setPrivateKey();
    privateKey = null;
    publicKey = null;
    setWrongPassword(false);
    setWrongPublicKey(false);
    setWrongPrivateKey(false);
    setKeysError(false);
    setIsDownloading(false);
    setIsTestingPassword(false);
    setIsTestingKeys(false);
    setPkAlert(false);
    setSumFilesSizes(0);
    file = null;
    files = [];
    numberOfFiles = 0;
    resetCurrFile();
    index = null;
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
    setWrongPassword(false);
  };

  const handlePublicKeyInput = (selectedKey) => {
    setPublicKey(selectedKey);
    publicKey = selectedKey;
    setWrongPublicKey(false);
  };

  const loadPublicKey = (file) => {
    if (file) {
      // files must be of text and size below 1 mb
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
      // files must be of text and size below 1 mb
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

  const testFilesDecryption = () => {
    numberOfFiles = Files.length;
    resetCurrFile();

    if (decryptionMethodState === "secretKey") {
      setIsTestingPassword(true);
      testPassword();
    }

    if (decryptionMethodState === "publicKey") {
      setIsTestingKeys(true);
      testKeys();
    }
  };

  const testPassword = () => {
    file = files[currFile];
    navigator.serviceWorker.ready.then((reg) => {
      file
        .slice(0, CHUNK_SIZE + crypto_secretstream_xchacha20poly1305_ABYTES)
        .arrayBuffer()
        .then((chunk) => {
          reg.active.postMessage({
            cmd: "testPassword",
            chunk,
            password,
          });
        });
    });
  };

  const testKeys = () => {
    file = files[currFile];
    navigator.serviceWorker.ready.then((reg) => {
      file
        .slice(0, CHUNK_SIZE + crypto_secretstream_xchacha20poly1305_ABYTES)
        .arrayBuffer()
        .then((chunk) => {
          reg.active.postMessage({
            cmd: "testKeys",
            chunk,
            privateKey,
            publicKey,
          });
        });
    });
  };

  const handleEncryptedFilesDownload = async (e) => {
    numberOfFiles = Files.length;
    prepareFile();
  };

  const prepareFile = () => {
    // send file name to sw
    let fileName = encodeURIComponent(formatName(files[currFile].name));
    navigator.serviceWorker.ready.then((reg) => {
      reg.active.postMessage({ cmd: "prepareFileNameDec", fileName });
    });
  };

  const kickOffDecryption = async () => {
    if (currFile <= numberOfFiles - 1) {
      file = files[currFile];
      window.open(`file`, "_self");
      setIsDownloading(true);

      if (decryptionMethodState === "publicKey") {
        navigator.serviceWorker.ready.then((reg) => {
          let mode = "derive";

          reg.active.postMessage({
            cmd: "requestDecKeyPair",
            privateKey,
            publicKey,
            mode,
          });
        });
      }

      if (decryptionMethodState === "secretKey") {
        navigator.serviceWorker.ready.then((reg) => {
          reg.active.postMessage({ cmd: "requestDecryption", password });
        });
      }
    } else {
      // console.log("out of files")
    }
  };

  const startDecryption = (method) => {
    navigator.serviceWorker.ready.then((reg) => {
      file
        .slice(0, CHUNK_SIZE + crypto_secretstream_xchacha20poly1305_ABYTES)
        .arrayBuffer()
        .then((chunk) => {
          index = CHUNK_SIZE + crypto_secretstream_xchacha20poly1305_ABYTES;

          if (method === "secretKey") {
            reg.active.postMessage(
              { cmd: "decryptFirstChunk", chunk, last: index >= file.size },
              [chunk]
            );
          }
          if (method === "publicKey") {
            reg.active.postMessage(
              {
                cmd: "asymmetricDecryptFirstChunk",
                chunk,
                last: index >= file.size,
              },
              [chunk]
            );
          }
        });
    });
  };

  const continueDecryption = (e) => {
    navigator.serviceWorker.ready.then((reg) => {
      file
        .slice(index, index + CHUNK_SIZE + crypto_secretstream_xchacha20poly1305_ABYTES)
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
    if (query.tab === "decryption" && query.publicKey) {
      setPublicKey(query.publicKey);
      publicKey = query.publicKey;
      setPkAlert(true);
      setDecryptionMethod("publicKey");
      decryptionMethodState = "publicKey";
    }
  }, [query.publicKey, query.tab]);

  useEffect(() => {
    navigator.serviceWorker.addEventListener("message", (e) => {
      switch (e.data.reply) {
        case "passwordCorrect":
          if (currFile < numberOfFiles - 1) {
            updateCurrFile();
            testPassword();
          } else {
            setIsTestingPassword(false);
            handleNext();
          }
          break;

        case "passwordIncorrect":
          setIsTestingPassword(false);
          setWrongPassword(true);
          break;

        case "keysCorrect":
          if (currFile < numberOfFiles - 1) {
            updateCurrFile();
            testKeys();
          } else {
            setIsTestingKeys(false);
            handleNext();
          }
          break;

        case "wrongPrivateKey":
          setIsTestingKeys(false);
          setWrongPrivateKey(true);
          break;

        case "wrongPublicKey":
          setIsTestingKeys(false);
          setWrongPublicKey(true);
          break;

        case "wrongKeyPair":
          setIsTestingKeys(false);
          setKeysError(true);
          setKeysErrorMessage(t("invalid_key_pair_dec"));
          break;

        case "wrongKeyInput":
          setIsTestingKeys(false);
          setKeysError(true);
          setKeysErrorMessage(t("invalid_keys_input"));
          break;

        case "keysGenerated":
          startDecryption("secretKey");
          break;

        case "keyPairReady":
          startDecryption("publicKey");
          break;

        case "filePreparedDec":
          kickOffDecryption();
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
      }
    });
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
      <Backdrop open={isDragActive} style={{ zIndex: 10 }}>
        <Typography
          variant="h2"
          gutterBottom
          style={{ color: "#fff", textAlign: "center" }}
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

      <Collapse in={pkAlert} style={{ marginTop: 5 }}>
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
          '& .MuiStepIcon-root.Mui-active': {
            color: (theme) => theme.palette.custom?.emperor?.main || "#525252",
          },
          '& .MuiStepIcon-root.Mui-completed': {
            color: (theme) => theme.palette.custom?.emperor?.main || "#525252",
          },
        }}
      >
        <Step key={1}>
          <StepLabel>
            {t("choose_files_dec")}
          </StepLabel>
          <StepContent>
            <div className="wrapper p-3" id="decFileWrapper">
              <Box
                id="decFileArea"
                sx={{
                  display: Files.length > 0 ? "" : "flex",
                  padding: "20px",
                  border: "5px dashed",
                  borderColor: (theme) => theme.palette.custom?.gallery?.main || "#ebebeb",
                  borderRadius: "14px",
                  marginBottom: "10px",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    marginBottom: '15px',
                    overflow: "auto",
                    maxHeight: "280px",
                    backgroundColor: "transparent",
                  }}
                >
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
                                style={{ marginTop: 40 }}
                                onClick={() => handleOpenInfo(file)}
                                edge="end"
                                aria-label="info"
                              >
                                <InfoIcon />
                              </IconButton>
                              <IconButton
                                style={{ marginTop: 40 }}
                                onClick={() => updateFilesInput(index)}
                                edge="end"
                                aria-label="delete"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))
                      : t("drag_drop_files_dec")}
                  </List>
                </Paper>

                <input
                  {...getInputProps()}
                  style={{ display: "none" }}
                  id="dec-file"
                  type="file"
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
                      color: (theme) => theme.palette.custom?.mineShaft?.main || "#3f3f3f",
                      backgroundColor: (theme) => theme.palette.custom?.alto?.light || "#ebebeb",
                      "&:hover": {
                        backgroundColor: (theme) => theme.palette.custom?.alto?.main || "#e1e1e1",
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
                        color: (theme) => theme.palette.custom?.flower?.text || "#611a15",
                        backgroundColor: (theme) => theme.palette.custom?.flower?.main || "#fdecea",
                        "&:hover": {
                          backgroundColor: (theme) => theme.palette.custom?.flower?.light || "#fadbd7",
                        },
                        transition: "background-color 0.2s ease-out, color .01s",
                      }}
                      component="span"
                      startIcon={<RotateLeftIcon />}
                    >
                      {t("reset")}
                    </Button>

                    <Box
                      component="small"
                      sx={{
                        float: "right",
                        marginTop: '15px',
                        textTransform: "none",
                        color: (theme) => theme.palette.custom?.cottonBoll?.text || "#0d3c61",
                        transition: "background-color 0.2s ease-out, color .01s",
                      }}
                    >
                      {Files.length} {Files.length > 1 ? t("files") : t("file")}
                      {Files.length > 1 && <>, {formatBytes(sumFilesSizes)}</>}
                    </Box>
                  </>
                )}
              </Box>
              <FileInfoDialog file={selectedFile} display={showInfo} onClose={handleCloseInfo} />
            </div>

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
                    backgroundColor: (theme) => theme.palette.primary?.main || "#464653",
                    color: (theme) => theme.palette.custom?.white?.main || "#ffffff",
                    "&:hover": {
                      backgroundColor: (theme) => theme.palette.custom?.mineShaft?.main || "#3f3f3f",
                    },
                    transition: "color .01s",
                  }}
                  className="nextBtnHs submitFileDec"
                >
                  {t("next")}
                </Button>
              </div>
            </Box>

            <Typography sx={{
                fontSize: 12,
                float: "right",
                color: (theme) => theme.palette.custom?.diamondBlack?.main || "rgba(0, 0, 0, 0.54)",
            }}>
              {t("offline_note")}
            </Typography>
          </StepContent>
        </Step>

        <Step key={2}>
          <StepLabel>
            {decryptionMethod === "secretKey"
              ? t("enter_password_dec")
              : t("enter_keys_dec")}
          </StepLabel>

          <StepContent>
            <FormControl
              component="fieldset"
              style={{ float: "right", marginBottom: "15px" }}
            >
              <RadioGroup
                row
                value={decryptionMethod}
                aria-label="decryption options"
              >
                <FormControlLabel
                  value="secretKey"
                  control={<Radio color="default" />}
                  label={t("password")}
                  labelPlacement="end"
                  onChange={() => handleRadioChange("secretKey")}
                />
                <FormControlLabel
                  value="publicKey"
                  control={<Radio color="default" />}
                  label={t("public_key")}
                  labelPlacement="end"
                  onChange={() => handleRadioChange("publicKey")}
                />
              </RadioGroup>
            </FormControl>

            {decryptionMethod === "secretKey" && (
              <TextField
                required
                error={wrongPassword ? true : false}
                type={showPassword ? "text" : "password"}
                id="decPasswordInput"
                label={wrongPassword ? t("error") : t("required")}
                helperText={wrongPassword ? t("wrong_password") : ""}
                placeholder={t("password")}
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
                    </>
                  ),
                }}
              />
            )}

            {decryptionMethod === "publicKey" && (
              <>
                <TextField
                  id="public-key-input-dec"
                  required
                  error={wrongPublicKey ? true : false}
                  label={
                    wrongPublicKey ? t("error") : t("sender_public_key")
                  }
                  helperText={wrongPublicKey ? t("wrong_public_key") : ""}
                  placeholder={t("enter_sender_public_key")}
                  variant="outlined"
                  value={PublicKey ? PublicKey : ""}
                  onChange={(e) => handlePublicKeyInput(e.target.value)}
                  fullWidth
                  style={{ marginBottom: "15px" }}
                  InputProps={{
                    endAdornment: (
                      <>
                        <input
                          accept=".public"
                          style={{ display: "none" }}
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
                  style={{ marginBottom: "15px" }}
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
                          style={{ display: "none" }}
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
                        backgroundColor: (theme) => theme.palette.custom?.mercury?.main || "#e9e9e9",
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
                        backgroundColor: (theme) => theme.palette.primary?.main || "#464653",
                        color: (theme) => theme.palette.custom?.white?.main || "#ffffff",
                        "&:hover": {
                          backgroundColor: (theme) => theme.palette.custom?.mineShaft?.main || "#3f3f3f",
                        },
                        transition: "color .01s",
                      }}
                      className="nextBtnHs submitKeysDec"
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
          <StepLabel>
            {t("download_decrypted_files")}
          </StepLabel>

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
                      backgroundColor: (theme) => theme.palette.custom?.mercury?.main || "#e9e9e9",
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
                    color="primary"
                    sx={{
                      marginTop: (theme) => theme.spacing(1),
                      marginRight: (theme) => theme.spacing(1),
                      borderRadius: "8px",
                      backgroundColor: (theme) => theme.palette.primary?.main || "#464653",
                      color: (theme) => theme.palette.custom?.white?.main || "#ffffff",
                      "&:hover": {
                        backgroundColor: (theme) => theme.palette.custom?.mineShaft?.main || "#3f3f3f",
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
                  >
                    <a
                      onClick={(e) => handleEncryptedFilesDownload(e)}
                      className="downloadFileDec"
                      style={{
                        width: "100%",
                        textDecoration: "none",
                      }}
                    >
                      {isDownloading
                        ? `${currFileState + 1}/${numberOfFiles} ${t(
                            "downloading_file"
                          )}`
                        : t("decrypted_files")}
                    </a>
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
        <Paper
          elevation={1}
          sx={{
            padding: (theme) => theme.spacing(3),
            boxShadow: "rgba(149, 157, 165, 0.4) 0px 8px 24px",
            borderRadius: "8px",
          }}
        >
          <Alert
            variant="outlined"
            severity="success"
            style={{ border: "none" }}
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
              color: (theme) => theme.palette.custom?.mineShaft?.main || "#3f3f3f",
              backgroundColor: (theme) => theme.palette.custom?.mercury?.light || "#f3f3f3",
              "&:hover": {
                backgroundColor: (theme) => theme.palette.custom?.mercury?.main || "#e9e9e9",
              },
              transition: "background-color 0.2s ease-out",
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

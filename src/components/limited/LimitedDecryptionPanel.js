import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useDropzone } from "react-dropzone";
import { formatBytes } from "../../helpers/formatBytes";
import { formatName } from "../../helpers/formatName";
import {
  crypto_secretstream_xchacha20poly1305_ABYTES,
  MAX_FILE_SIZE,
  CHUNK_SIZE,
  SIGNATURES,
  decoder,
} from "../../config/Constants";
import { Alert, AlertTitle, Box, Grid, Stepper, Step, StepLabel, StepContent, Button, Paper, Typography, TextField, Backdrop, CircularProgress, IconButton, Tooltip, Collapse, List, ListItem, ListItemSecondaryAction, ListItemText } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import DescriptionIcon from "@mui/icons-material/Description";
import GetAppIcon from "@mui/icons-material/GetApp";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import InfoIcon from "@mui/icons-material/Info";
import FileInfoDialog from "../FileInfoDialog.jsx";
import { getTranslations as t } from "../../../locales";
import { getCustom } from "../../config/Theme";

const _sodium = require("libsodium-wrappers");

let file,
  limitedDecIndex,
  limitedTestDecFileBuff,
  limitedDecFileBuff,
  decRx,
  decTx;

const LimitedDecryptionPanel = () => {
  const [activeStep, setActiveStep] = useState(0);
  const router = useRouter();
  const query = router.query;

  const [File, setFile] = useState();
  const [largeFile, setLargeFile] = useState(false);
  const [Password, setPassword] = useState();
  const [decryptionMethod, setDecryptionMethod] = useState("secretKey");
  const [PublicKey, setPublicKey] = useState();
  const [PrivateKey, setPrivateKey] = useState();
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [wrongPublicKey, setWrongPublicKey] = useState(false);
  const [wrongPrivateKey, setWrongPrivateKey] = useState(false);
  const [keysError, setKeysError] = useState(false);
  const [keysErrorMessage, setKeysErrorMessage] = useState();
  const [isCheckingFile, setIsCheckingFile] = useState(false);
  const [badFile, setbadFile] = useState(false);
  const [oldVersion, setOldVersion] = useState(false);
  const [wrongPassword, setWrongPassword] = useState(false);
  const [isTestingPassword, setIsTestingPassword] = useState(false);
  const [isTestingKeys, setIsTestingKeys] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [pkAlert, setPkAlert] = useState(false);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFile) => {
      handleLimitedFileInput(acceptedFile[0]);
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
    setIsDecrypting(false);
  };

  const handleReset = () => {
    setActiveStep(0);
    setFile();
    setPassword();
    setWrongPassword(false);
    setbadFile(false);
    setOldVersion(false);
    setPublicKey();
    setPrivateKey();
    setWrongPublicKey(false);
    setWrongPrivateKey(false);
    setKeysError(false);
    setPkAlert(false);
    file = null;
    limitedDecIndex = null;
    (decRx = null), (decTx = null);
    router.replace(router.pathname);
  };

  const handleLimitedFileInput = (selectedFile) => {
    file = selectedFile;

    if (file.size > MAX_FILE_SIZE) {
      setLargeFile(true);
      setFile();
    } else {
      setFile(selectedFile);
      setLargeFile(false);
    }

    setbadFile(false);
    setOldVersion(false);
  };

  const removeFile = () => {
    setFile();
    setbadFile(false);
    setOldVersion(false);
  }

  const checkFile = () => {
    setIsCheckingFile(true);
    setbadFile(false);
    setOldVersion(false);

    Promise.all([
      file.slice(0, 11).arrayBuffer(),
      file.slice(0, 22).arrayBuffer(),
    ]).then(([signature, legacy]) => {
      if (decoder.decode(signature) === SIGNATURES["v2_symmetric"]) {
        setDecryptionMethod("secretKey");
        setActiveStep(1);
        setIsCheckingFile(false);
      } else if (decoder.decode(signature) === SIGNATURES["v2_asymmetric"]) {
        setDecryptionMethod("publicKey");
        setActiveStep(1);
        setIsCheckingFile(false);
      } else if (decoder.decode(legacy) === SIGNATURES["v1"]) {
        setOldVersion(true);
        setIsCheckingFile(false);
      } else {
        setbadFile(true);
        setIsCheckingFile(false);
      }
    });
  };

  const handlePasswordInput = (selectedPassword) => {
    setPassword(selectedPassword);
    setWrongPassword(false);
  };

  const handlePublicKeyInput = (selectedKey) => {
    setPublicKey(selectedKey);
    setWrongPublicKey(false);
  };

  const loadPublicKey = (file) => {
    if (file) {
      if (file.size <= 1000000) {
        const reader = new FileReader();
        reader.readAsText(file);
        reader.onload = () => {
          setPublicKey(reader.result);
        };
      }
    }
  };

  const handlePrivateKeyInput = (selectedKey) => {
    setPrivateKey(selectedKey);
    setWrongPrivateKey(false);
  };

  const loadPrivateKey = (file) => {
    if (file) {
      if (file.size <= 1000000) {
        const reader = new FileReader();
        reader.readAsText(file);
        reader.onload = () => {
          setPrivateKey(reader.result);
        };
      }
    }
  };

  const requestDecKeyPair = async (ssk, cpk, header, decFileBuff) => {
    await _sodium.ready;
    const sodium = _sodium;

    try {
      let keyFromkeypair = sodium.crypto_kx_server_session_keys(
        sodium.crypto_scalarmult_base(sodium.from_base64(ssk)),
        sodium.from_base64(ssk),
        sodium.from_base64(cpk)
      );

      if (keyFromkeypair) {
        [decRx, decTx] = [keyFromkeypair.sharedRx, keyFromkeypair.sharedTx];
        if (decRx && decTx) {
          let limitedDecState =
            sodium.crypto_secretstream_xchacha20poly1305_init_pull(
              new Uint8Array(header),
              decRx
            );

          if (limitedDecState) {
            setIsTestingKeys(false);
            setIsTestingPassword(false);
            startLimitedDecryption("publicKey", limitedDecState);
          }
        }
      }
    } catch (error) {
      setKeysError(true);
      setKeysErrorMessage(t("invalid_keys_input"));
      setIsTestingKeys(false);
    }
  };

  const testLimitedDecryption = async () => {
    await _sodium.ready;
    const sodium = _sodium;

    if (decryptionMethod === "secretKey") {
      setIsTestingPassword(true);

      file = File;
      let limitedTestPassword = Password;

      Promise.all([
        file.slice(11, 27).arrayBuffer(),
        file.slice(27, 51).arrayBuffer(),
        file
          .slice(
            51,
            51 +
              CHUNK_SIZE +
              sodium.crypto_secretstream_xchacha20poly1305_ABYTES
          )
          .arrayBuffer(),
      ]).then(([limitedTestSalt, limitedTestHeader, limitedTestChunk]) => {
        limitedTestDecFileBuff = limitedTestChunk;

        let decLimitedTestsalt = new Uint8Array(limitedTestSalt);
        let decLimitedTestheader = new Uint8Array(limitedTestHeader);

        let decLimitedTestKey = sodium.crypto_pwhash(
          sodium.crypto_secretstream_xchacha20poly1305_KEYBYTES,
          limitedTestPassword,
          decLimitedTestsalt,
          sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
          sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
          sodium.crypto_pwhash_ALG_ARGON2ID13
        );

        let limitedTestState =
          sodium.crypto_secretstream_xchacha20poly1305_init_pull(
            decLimitedTestheader,
            decLimitedTestKey
          );

        if (limitedTestState) {
          let decLimitedTestresults =
            sodium.crypto_secretstream_xchacha20poly1305_pull(
              limitedTestState,
              new Uint8Array(limitedTestDecFileBuff)
            );
          if (decLimitedTestresults) {
            setIsTestingPassword(false);

            limitedDecKeyGenerator(
              limitedTestPassword,
              limitedTestSalt,
              limitedTestHeader
            );
          } else {
            setIsTestingPassword(false);
            setWrongPassword(true);
          }
        }
      });
    }

    if (decryptionMethod === "publicKey") {
      setKeysError(false);
      setWrongPrivateKey(false);
      setWrongPublicKey(false);
      setIsTestingKeys(true);

      file = File;
      let ssk = PrivateKey;
      let cpk = PublicKey;

      Promise.all([
        file.slice(11, 35).arrayBuffer(),
        file
          .slice(
            35,
            35 +
              CHUNK_SIZE +
              sodium.crypto_secretstream_xchacha20poly1305_ABYTES
          )
          .arrayBuffer(),
      ]).then(([limitedTestHeader, limitedTestChunk]) => {
        limitedTestDecFileBuff = limitedTestChunk;

        let decLimitedTestheader = new Uint8Array(limitedTestHeader);

        try {
          let computed = sodium.crypto_scalarmult_base(sodium.from_base64(ssk));
          computed = sodium.to_base64(computed);
          if (ssk === cpk || cpk === computed) {
            setKeysError(true);
            setKeysErrorMessage(t("invalid_key_pair"));
            setIsTestingKeys(false);
            return;
          }

          if (
            sodium.from_base64(ssk).length !== sodium.crypto_kx_SECRETKEYBYTES
          ) {
            setWrongPrivateKey(true);
            setIsTestingKeys(false);
            return;
          }

          if (
            sodium.from_base64(cpk).length !== sodium.crypto_kx_PUBLICKEYBYTES
          ) {
            setWrongPublicKey(true);
            setIsTestingKeys(false);
            return;
          }

          let limitedDecKey = sodium.crypto_kx_server_session_keys(
            sodium.crypto_scalarmult_base(sodium.from_base64(ssk)),
            sodium.from_base64(ssk),
            sodium.from_base64(cpk)
          );

          if (limitedDecKey) {
            [decRx, decTx] = [limitedDecKey.sharedRx, limitedDecKey.sharedTx];

            if (decRx && decTx) {
              let limitedDecState =
                sodium.crypto_secretstream_xchacha20poly1305_init_pull(
                  new Uint8Array(decLimitedTestheader),
                  decRx
                );

              if (limitedDecState) {
                let decTestresults =
                  sodium.crypto_secretstream_xchacha20poly1305_pull(
                    limitedDecState,
                    new Uint8Array(limitedTestDecFileBuff)
                  );

                if (decTestresults) {
                  setIsTestingKeys(false);
                  setIsTestingPassword(false);
                  requestDecKeyPair(
                    ssk,
                    cpk,
                    decLimitedTestheader,
                    limitedTestDecFileBuff
                  );
                } else {
                  setWrongPublicKey(true);
                  setWrongPrivateKey(true);
                  setIsTestingKeys(false);
                }
              }
            }
          }
        } catch (error) {
          setKeysError(true);
          setKeysErrorMessage(t("invalid_keys_input"));
          setIsTestingKeys(false);
        }
      });
    }
  };

  const limitedDecKeyGenerator = async (password, salt, header) => {
    await _sodium.ready;
    const sodium = _sodium;

    file = File;

    let limitedDecSalt = new Uint8Array(salt);
    let limitedDecHeader = new Uint8Array(header);

    let limitedDecKey = sodium.crypto_pwhash(
      sodium.crypto_secretstream_xchacha20poly1305_KEYBYTES,
      password,
      limitedDecSalt,
      sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
      sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
      sodium.crypto_pwhash_ALG_ARGON2ID13
    );

    let limitedDecState =
      sodium.crypto_secretstream_xchacha20poly1305_init_pull(
        limitedDecHeader,
        limitedDecKey
      );

    if (limitedDecState) {
      startLimitedDecryption("secretKey", limitedDecState);
    }
  };

  const startLimitedDecryption = (method, dec_state) => {
    let startIndex;
    if (method === "secretKey") startIndex = 51;
    if (method === "publicKey") startIndex = 35;

    setIsDecrypting(true);
    limitedDecFileBuff = [];
    file = File;

    file
      .slice(
        startIndex,
        startIndex + CHUNK_SIZE + crypto_secretstream_xchacha20poly1305_ABYTES
      )
      .arrayBuffer()
      .then((chunk) => {
        limitedDecIndex =
          startIndex +
          CHUNK_SIZE +
          crypto_secretstream_xchacha20poly1305_ABYTES;
        let limitedDecLast = limitedDecIndex >= file.size;
        limitedChunkDecryption(limitedDecLast, chunk, dec_state);
      });
  };

  const continueLimitedDecryption = (dec_state) => {
    file = File;

    file
      .slice(
        limitedDecIndex,
        limitedDecIndex +
          CHUNK_SIZE +
          crypto_secretstream_xchacha20poly1305_ABYTES
      )
      .arrayBuffer()
      .then((chunk) => {
        limitedDecIndex +=
          CHUNK_SIZE + crypto_secretstream_xchacha20poly1305_ABYTES;
        let limitedDecLast = limitedDecIndex >= file.size;
        limitedChunkDecryption(limitedDecLast, chunk, dec_state);
      });
  };

  const limitedChunkDecryption = async (limitedDecLast, chunk, dec_state) => {
    await _sodium.ready;
    const sodium = _sodium;

    let limitedDecResult = sodium.crypto_secretstream_xchacha20poly1305_pull(
      dec_state,
      new Uint8Array(chunk)
    );

    if (limitedDecResult) {
      let limitedDecryptedChunk = limitedDecResult.message;

      limitedDecFileBuff.push(new Uint8Array(limitedDecryptedChunk));

      if (limitedDecLast) {
        handleFinishedDecryption();
      }
      if (!limitedDecLast) {
        continueLimitedDecryption(dec_state);
      }
    } else {
      setWrongPassword(true);
      setIsTestingPassword(false);
    }
  };

  const handleFinishedDecryption = () => {
    handleNext();
    setIsDecrypting(false);
  };

  const handleDecryptedFileDownload = () => {
    if (typeof window === "undefined") return;
    let fileName = formatName(File.name);
    let blob = new Blob(limitedDecFileBuff);
    let link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
  };

  useEffect(() => {
    if (query.tab === "decryption" && query.publicKey) {
      setPublicKey(query.publicKey);
      setPkAlert(true);
      setDecryptionMethod("publicKey");
    }
  }, [query.publicKey, query.tab]);

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
          <StepLabel>{t("choose_file_dec")}</StepLabel>
          <StepContent>
            <FileInfoDialog file={selectedFile} display={showInfo} onClose={handleCloseInfo} />
            <Box className="wrapper p-3" id="encFileWrapper">
              <Box
                id="encFileArea"
                sx={{
                  padding: "20px",
                  border: "5px dashed",
                  borderColor: (theme) => getCustom(theme).gallery.main,
                  borderRadius: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  marginBottom: "10px",
                }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    overflow: "auto",
                    maxHeight: "280px",
                    backgroundColor: "transparent",
                  }}
                >
                  <List
                    dense={true}
                    sx={{
                      display: "flex",
                      flex: "1",
                      flexWrap: "wrap",
                      alignContent: "center",
                      justifyContent: "center",
                    }}
                  >
                    {File ? (
                      <ListItem
                        sx={{
                          backgroundColor: "#ebebeb",
                          borderRadius: "8px",
                          padding: '15px',
                        }}
                      >
                        <ListItemText
                          sx={{
                            width: "200px",
                            minHeight: "50px",
                            maxHeight: "50px",
                            textAlign: "center",
                          }}
                          primary={File.name}
                          secondary={formatBytes(File.size)}
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            sx={{ marginTop: '40px' }}
                            onClick={() => handleOpenInfo(File)}
                            edge="end"
                            aria-label="info"
                          >
                            <InfoIcon />
                          </IconButton>
                          <IconButton
                            sx={{ marginTop: '40px' }}
                            onClick={() => removeFile()}
                            edge="end"
                            aria-label="delete"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ) : (
                      t("drag_drop")
                    )}
                  </List>
                </Paper>

                <input
                  id="dec-file"
                  type="file"
                  style={{ display: 'none' }}
                  onChange={(e) => handleLimitedFileInput(e.target.files[0])}
                />
                <label htmlFor="dec-file">
                  <br />
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
                    startIcon={<DescriptionIcon />}
                  >
                    {File ? t("change_file") : t("browse_file")}
                  </Button>
                </label>
              </Box>
            </Box>

            <Box sx={{ marginBottom: (theme) => theme.spacing(2) }}>
              <div>
                <Button
                  disabled={isCheckingFile || !File}
                  variant="contained"
                  onClick={checkFile}
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

                {largeFile && (
                  <>
                    <Alert severity="error" sx={{ marginTop: '15px' }}>
                      <strong>{t("file_too_big")}</strong>{" "}
                      {t("choose_file_1gb")}
                    </Alert>
                  </>
                )}
              </div>

              {badFile && (
                <Alert severity="error" sx={{ marginTop: '15px' }}>
                  {t("file_not_encrypted_corrupted")}
                </Alert>
              )}

              {oldVersion && (
                <Alert severity="error" sx={{ marginTop: '15px' }}>
                  {t("old_version")}{" "}
                  <a href="https://v1.hat.sh/" target="_blank" rel="noreferrer">
                    {"https://v1.hat.sh"}
                  </a>
                </Alert>
              )}
            </Box>

            {!badFile && !oldVersion && !largeFile && (
              <Typography sx={{
                fontSize: 12,
                float: "right",
                color: (theme) => getCustom(theme).diamondBlack.main,
              }}>
                {t("offline_note")}
              </Typography>
            )}
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
                        activeStep === 0 ||
                        isTestingPassword ||
                        isTestingKeys ||
                        isDecrypting
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
                        isTestingKeys ||
                        isDecrypting
                      }
                      variant="contained"
                      onClick={testLimitedDecryption}
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
                        (isTestingPassword || isDecrypting) && (
                          <CircularProgress
                            size={24}
                          />
                        )
                      }
                      fullWidth
                    >
                      {isTestingPassword
                        ? t("testing_password")
                        : isTestingKeys
                        ? t("testing_keys")
                        : isDecrypting
                        ? t("decrypting_file")
                        : t("next")}
                    </Button>
                  </Grid>
                </Grid>
                <br />

                {decryptionMethod === "publicKey" && keysError && (
                  <Alert severity="error">{keysErrorMessage}</Alert>
                )}

                {isDecrypting && (
                  <Alert variant="outlined" severity="info">
                    {t("page_close_alert_dec")}
                  </Alert>
                )}
              </div>
            </Box>
          </StepContent>
        </Step>

        <Step key={3}>
          <StepLabel>{t("download_decrypted_file")}</StepLabel>
        </Step>
      </Stepper>

      {activeStep === 2 && (
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
            {t("success_decrypted")}
          </Alert>

          <Grid container spacing={1} sx={{ marginTop: '5px' }}>
            <Grid item xs={12}>
              <Button
                onClick={handleDecryptedFileDownload}
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
                  textTransform: "none"
                }}
                className="nextBtnHs"
                variant="contained"
                startIcon={<GetAppIcon />}
                fullWidth
              >
                {t("download_file")}
              </Button>
            </Grid>
            <Grid item xs={12}>
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
                {t("decrypt_another_file")}
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Box>
  );
};

export default LimitedDecryptionPanel;

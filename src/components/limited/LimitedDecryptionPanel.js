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
import { Alert, AlertTitle } from "@mui/material";
import Grid from "@mui/material/Grid";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import StepContent from "@mui/material/StepContent";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Backdrop from "@mui/material/Backdrop";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Collapse from "@mui/material/Collapse";
import RefreshIcon from "@mui/icons-material/Refresh";
import DescriptionIcon from "@mui/icons-material/Description";
import GetAppIcon from "@mui/icons-material/GetApp";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import CloseIcon from "@mui/icons-material/Close";
import {
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import InfoIcon from "@mui/icons-material/Info";
import FileInfoDialog from "../FileInfoDialog";
import { getTranslations as t } from "../../../locales";
import Box from "@mui/material/Box";

const _sodium = require("libsodium-wrappers");

const LimitedDecryptionPanel = () => {
  const router = useRouter();

  const query = router.query;

  const [activeStep, setActiveStep] = useState(0);

  const [File, setFile] = useState();

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

  const [isDecrypting, setIsDecrypting] = useState(false);

  const [pkAlert, setPkAlert] = useState(false);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      handleFilesInput(acceptedFiles);
    },
    noClick: true,
    noKeyboard: true,
    disabled: activeStep !== 0,
    multiple: false,
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
  };

  const handleRadioChange = (method) => {
    setDecryptionMethod(method);
  };

  const handleReset = () => {
    setActiveStep(0);
    setFile();
    setPassword();
    setPublicKey();
    setPrivateKey();
    setWrongPassword(false);
    setWrongPublicKey(false);
    setWrongPrivateKey(false);
    setKeysError(false);
    setIsDecrypting(false);
    setPkAlert(false);
    router.replace(router.pathname);
  };

  const handleFilesInput = (selectedFiles) => {
    if (selectedFiles[0].size > MAX_FILE_SIZE) {
      alert(t("file_too_large_limited"));
      return;
    }
    setFile(selectedFiles[0]);
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
      // files must be of text and size below 1 mb
      if (file.size <= 1000000) {
        const reader = new FileReader();
        reader.readAsText(file);
        reader.onload = () => {
          setPublicKey(reader.result);
        };
        setWrongPublicKey(false);
      }
    }
  };

  const handlePrivateKeyInput = (selectedKey) => {
    setPrivateKey(selectedKey);
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
        };
        setWrongPrivateKey(false);
      }
    }
  };

  const handleDecryptionRequest = async () => {
    setIsDecrypting(true);
    await _sodium.ready;
    const sodium = _sodium;

    let reader = new FileReader();
    reader.readAsArrayBuffer(File);
    reader.onload = async () => {
      let cipherTextFull = new Uint8Array(reader.result);
      let plainText;

      try {
        if (decryptionMethod === "secretKey") {
          let header = cipherTextFull.slice(
            SIGNATURES.length,
            SIGNATURES.length + sodium.crypto_secretstream_xchacha20poly1305_HEADERBYTES
          );
          let salt = cipherTextFull.slice(
            SIGNATURES.length + sodium.crypto_secretstream_xchacha20poly1305_HEADERBYTES,
            SIGNATURES.length +
              sodium.crypto_secretstream_xchacha20poly1305_HEADERBYTES +
              sodium.crypto_pwhash_SALTBYTES
          );
          let cipherText = cipherTextFull.slice(
            SIGNATURES.length +
              sodium.crypto_secretstream_xchacha20poly1305_HEADERBYTES +
              sodium.crypto_pwhash_SALTBYTES
          );

          let key = sodium.crypto_pwhash(
            sodium.crypto_secretstream_xchacha20poly1305_KEYBYTES,
            Password,
            salt,
            sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
            sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
            sodium.crypto_pwhash_ALG_ARGON2ID13
          );

          let res = sodium.crypto_secretstream_xchacha20poly1305_init_pull(
            header,
            key
          );
          let state = res.state;

          let decryptedMsg = sodium.crypto_secretstream_xchacha20poly1305_pull(
            state,
            cipherText
          );
          plainText = decryptedMsg.message;
        }

        if (decryptionMethod === "publicKey") {
          let sender_pk = sodium.from_base64(PublicKey);
          let recipient_sk = sodium.from_base64(PrivateKey);

          let header = cipherTextFull.slice(
            SIGNATURES.length,
            SIGNATURES.length + sodium.crypto_secretstream_xchacha20poly1305_HEADERBYTES
          );
          let eph_pk = cipherTextFull.slice(
            SIGNATURES.length + sodium.crypto_secretstream_xchacha20poly1305_HEADERBYTES,
            SIGNATURES.length +
              sodium.crypto_secretstream_xchacha20poly1305_HEADERBYTES +
              sodium.crypto_box_PUBLICKEYBYTES
          );
          let cipherText = cipherTextFull.slice(
            SIGNATURES.length +
              sodium.crypto_secretstream_xchacha20poly1305_HEADERBYTES +
              sodium.crypto_box_PUBLICKEYBYTES
          );

          let rx = sodium.crypto_box_beforenm(sender_pk, recipient_sk);

          let res = sodium.crypto_secretstream_xchacha20poly1305_init_pull(
            header,
            rx
          );
          let state = res.state;

          let decryptedMsg = sodium.crypto_secretstream_xchacha20poly1305_pull(
            state,
            cipherText
          );
          plainText = decryptedMsg.message;
        }

        let blob = new Blob([plainText], { type: "application/octet-stream" });
        let url = window.URL.createObjectURL(blob);
        let a = document.createElement("a");
        a.href = url;
        a.download = formatName(File.name);
        a.click();
        window.URL.revokeObjectURL(url);
        setIsDecrypting(false);
        handleNext();
      } catch (e) {
        setIsDecrypting(false);
        if (decryptionMethod === "secretKey") {
          setWrongPassword(true);
        } else {
          setKeysError(true);
          setKeysErrorMessage(t("invalid_keys_input"));
        }
      }
    };
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
            {t("choose_file_dec")}
          </StepLabel>
          <StepContent>
            <div className="wrapper p-3" id="decFileWrapper">
              <Box
                id="decFileArea"
                sx={{
                  display: File ? "" : "flex",
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
                    {File ? (
                      <ListItem
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
                          primary={File.name}
                          secondary={formatBytes(File.size)}
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            style={{ marginTop: 40 }}
                            onClick={() => handleOpenInfo(File)}
                            edge="end"
                            aria-label="info"
                          >
                            <InfoIcon />
                          </IconButton>
                          <IconButton
                            style={{ marginTop: 40 }}
                            onClick={() => setFile()}
                            edge="end"
                            aria-label="delete"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ) : (
                      t("drag_drop_file_dec")
                    )}
                  </List>
                </Paper>

                <input
                  {...getInputProps()}
                  style={{ display: "none" }}
                  id="dec-file"
                  type="file"
                  onChange={(e) => handleFilesInput(e.target.files)}
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
                    startIcon={File ? <RefreshIcon /> : <DescriptionIcon />}
                  >
                    {File ? t("change_file") : t("browse_file")}
                  </Button>
                </label>
              </Box>
              <FileInfoDialog file={selectedFile} display={showInfo} onClose={handleCloseInfo} />
            </div>

            <Box sx={{ marginBottom: (theme) => theme.spacing(2) }}>
              <div>
                <Button
                  fullWidth
                  disabled={!File}
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
                  className="nextBtnHs"
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
                          (!PublicKey || !PrivateKey))
                      }
                      variant="contained"
                      onClick={handleDecryptionRequest}
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
                      fullWidth
                    >
                      {t("next")}
                    </Button>
                  </Grid>
                </Grid>
                <br />

                {decryptionMethod === "publicKey" && keysError && (
                  <Alert severity="error">{keysErrorMessage}</Alert>
                )}
              </div>
            </Box>
          </StepContent>
        </Step>

        <Step key={3}>
          <StepLabel>
            {t("decrypt_file")}
          </StepLabel>
          <StepContent>
            <Alert severity="success" icon={<LockOpenIcon />}>
              <strong>{File ? File.name : ""}</strong> {t("ready_to_download")}
            </Alert>

            <Box sx={{ marginBottom: (theme) => theme.spacing(2) }}>
              <Grid container spacing={1}>
                <Grid item>
                  <Button
                    disabled={activeStep === 0 || isDecrypting}
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
                    disabled={isDecrypting || !File}
                    onClick={handleDecryptionRequest}
                    variant="contained"
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
                      isDecrypting ? (
                        <CircularProgress
                          size={24}
                        />
                      ) : (
                        <LockOpenIcon />
                      )
                    }
                    fullWidth
                  >
                    {isDecrypting ? t("decrypting_file") : t("decrypt_file")}
                  </Button>
                </Grid>
              </Grid>
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
            {t("success_decrypted")}
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
              transition: "background-color 0.2s ease-out, color .01s",
              textTransform: "none"
            }}
            variant="outlined"
            startIcon={<RefreshIcon />}
            fullWidth
          >
            {t("decrypt_another_file")}
          </Button>
        </Paper>
      )}
    </Box>
  );
};

export default LimitedDecryptionPanel;

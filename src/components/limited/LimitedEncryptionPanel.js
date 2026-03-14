import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useDropzone } from "react-dropzone";
import KeyPairGeneration from "../KeyPairGeneration";
import passwordStrengthCheck from "../../utils/passwordStrengthCheck";
import {
  MAX_FILE_SIZE,
  SIGNATURES,
  CHUNK_SIZE,
  encoder,
} from "../../config/Constants";
import { formatBytes } from "../../helpers/formatBytes";
import { computePublicKey } from "../../utils/computePublicKey";
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
import CircularProgress from "@mui/material/CircularProgress";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormControl from "@mui/material/FormControl";
import Tooltip from "@mui/material/Tooltip";
import Backdrop from "@mui/material/Backdrop";
import IconButton from "@mui/material/IconButton";
import Snackbar from "@mui/material/Snackbar";
import FileCopyIcon from "@mui/icons-material/FileCopy";
import RefreshIcon from "@mui/icons-material/Refresh";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import DescriptionIcon from "@mui/icons-material/Description";
import GetAppIcon from "@mui/icons-material/GetApp";
import CachedIcon from "@mui/icons-material/Cached";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import LinkIcon from "@mui/icons-material/Link";
import Collapse from "@mui/material/Collapse";
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
import { generatePassword, generatePassPhrase } from "../../utils/generatePassword";
import Box from "@mui/material/Box";
const _sodium = require("libsodium-wrappers");

const LimitedEncryptionPanel = () => {
  const router = useRouter();

  const query = router.query;

  const [activeStep, setActiveStep] = useState(0);

  const [File, setFile] = useState();

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

  const [isEncrypting, setIsEncrypting] = useState(false);

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
    multiple: false,
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
  };

  const handleReset = () => {
    setActiveStep(0);
    setFile();
    setPassword();
    setPublicKey();
    setPrivateKey();
    setWrongPublicKey(false);
    setWrongPrivateKey(false);
    setKeysError(false);
    setShortPasswordError(false);
    setIsEncrypting(false);
    setShareableLink();
    setSnackBarMessage();
    setPkAlert(false);
    router.replace(router.pathname);
  };

  const showSnackBar = () => {
    setSnackBarOpen(!snackBarOpen);
  };

  const handleMethodStep = () => {
    if (encryptionMethod === "secretKey") {
      if (Password.length >= 12) {
        handleNext();
      } else {
        setShortPasswordError(true);
      }
    }

    if (encryptionMethod === "publicKey") {
      testKeyPair();
    }
  };

  const testKeyPair = async () => {
    await _sodium.ready;
    const sodium = _sodium;
    try {
      let pk = sodium.from_base64(PublicKey);
      let sk = sodium.from_base64(PrivateKey);

      if (pk.length !== sodium.crypto_box_PUBLICKEYBYTES) {
        setWrongPublicKey(true);
        return;
      }
      if (sk.length !== sodium.crypto_box_SECRETKEYBYTES) {
        setWrongPrivateKey(true);
        return;
      }

      handleNext();
    } catch (e) {
      setKeysError(true);
      setKeysErrorMessage(t("invalid_keys_input"));
    }
  };

  const generatedPassword = async () => {
    if (isPassphraseMode === false && encryptionMethod === "secretKey") {
      let generated = await generatePassword();
      setPassword(generated);
      setShortPasswordError(false);
    }else if (isPassphraseMode === true && encryptionMethod === "secretKey") {
      let generated = await generatePassPhrase();
      setPassword(generated);
      setShortPasswordError(false);
    };
  }

  const handleFilesInput = (selectedFiles) => {
    if (selectedFiles[0].size > MAX_FILE_SIZE) {
      setSnackBarMessage(t("file_too_large_limited"));
      showSnackBar();
      return;
    }
    setFile(selectedFiles[0]);
  };

  const handlePasswordInput = (selectedPassword) => {
    setPassword(selectedPassword);
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

  const handleEncryptionRequest = async () => {
    setIsEncrypting(true);
    await _sodium.ready;
    const sodium = _sodium;

    let reader = new FileReader();
    reader.readAsArrayBuffer(File);
    reader.onload = async () => {
      let plainText = new Uint8Array(reader.result);
      let cipherText;

      if (encryptionMethod === "secretKey") {
        let salt = sodium.randombytes_buf(sodium.crypto_pwhash_SALTBYTES);
        let key = sodium.crypto_pwhash(
          sodium.crypto_secretstream_xchacha20poly1305_KEYBYTES,
          Password,
          salt,
          sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
          sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
          sodium.crypto_pwhash_ALG_ARGON2ID13
        );

        let res = sodium.crypto_secretstream_xchacha20poly1305_init_push(key);
        let state = res.state;
        let header = res.header;

        let encryptedMsg = sodium.crypto_secretstream_xchacha20poly1305_push(
          state,
          plainText,
          null,
          sodium.crypto_secretstream_xchacha20poly1305_TAG_FINAL
        );

        cipherText = new Uint8Array(
          SIGNATURES.length + header.length + salt.length + encryptedMsg.length
        );
        cipherText.set(SIGNATURES);
        cipherText.set(header, SIGNATURES.length);
        cipherText.set(salt, SIGNATURES.length + header.length);
        cipherText.set(encryptedMsg, SIGNATURES.length + header.length + salt.length);
      }

      if (encryptionMethod === "publicKey") {
        let recipient_pk = sodium.from_base64(PublicKey);
        let sender_sk = sodium.from_base64(PrivateKey);

        let res = sodium.crypto_box_seal_keypair();
        let eph_pk = res.publicKey;
        let eph_sk = res.privateKey;

        let rx = sodium.crypto_box_beforenm(recipient_pk, eph_sk);
        let tx = sodium.crypto_box_beforenm(eph_pk, sender_sk);

        let res2 = sodium.crypto_secretstream_xchacha20poly1305_init_push(rx);
        let state = res2.state;
        let header = res2.header;

        let encryptedMsg = sodium.crypto_secretstream_xchacha20poly1305_push(
          state,
          plainText,
          null,
          sodium.crypto_secretstream_xchacha20poly1305_TAG_FINAL
        );

        cipherText = new Uint8Array(
          SIGNATURES.length +
            header.length +
            sodium.crypto_box_PUBLICKEYBYTES +
            encryptedMsg.length
        );
        cipherText.set(SIGNATURES);
        cipherText.set(header, SIGNATURES.length);
        cipherText.set(eph_pk, SIGNATURES.length + header.length);
        cipherText.set(
          encryptedMsg,
          SIGNATURES.length + header.length + sodium.crypto_box_PUBLICKEYBYTES
        );
      }

      let blob = new Blob([cipherText], { type: "application/octet-stream" });
      let url = window.URL.createObjectURL(blob);
      let a = document.createElement("a");
      a.href = url;
      a.download = File.name + ".enc";
      a.click();
      window.URL.revokeObjectURL(url);
      setIsEncrypting(false);
      handleNext();
    };
  };

  const handleEncryptedFileDownload = () => {
    // Logic to re-trigger download if needed,
    // but the actual download happens at the end of encryption.
  };

  const createShareableLink = async () => {
    let pk = await computePublicKey(PrivateKey);
    let link = window.location.origin + "/?tab=decryption&publicKey=" + pk;
    setShareableLink(link);
  };

  useEffect(() => {
    if (query.tab === "encryption" && query.publicKey) {
      setPublicKey(query.publicKey);
      setPkAlert(true);
      setEncryptionMethod("publicKey");
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
      <Snackbar
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        open={snackBarOpen}
        autoHideDuration={4000}
        onClose={showSnackBar}
      >
        <Alert severity="error">
          {snackBarMessage}
        </Alert>
      </Snackbar>

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
          {t("drop_file_enc")}
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
          {t("recipient_key_loaded")}
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
            {t("choose_file_enc")}
          </StepLabel>
          <StepContent>
            <div className="wrapper p-3" id="encFileWrapper">
              <Box
                id="encFileArea"
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
                      t("drag_drop_file")
                    )}
                  </List>
                </Paper>

                <input
                  {...getInputProps()}
                  style={{ display: "none" }}
                  id="enc-file"
                  type="file"
                  onChange={(e) => handleFilesInput(e.target.files)}
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
            {encryptionMethod !== "secretKey"
              ?  t("enter_keys_enc") : isPassphraseMode ? t("enter_passphrase") :  t("enter_password_enc") }
          </StepLabel>

          <StepContent>
            <FormControl
              component="fieldset"
              style={{ float: "right", marginBottom: "15px" }}
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
                  style={{ marginBottom: "15px" }}
                  InputProps={{
                    endAdornment: (
                      <>
                        <input
                          accept=".public"
                          style={{ display: "none" }}
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
          <StepLabel>
            {t("encrypt_file")}
          </StepLabel>
          <StepContent>
            <Alert severity="success" icon={<LockOutlinedIcon />}>
              <strong>{File ? File.name : ""}</strong> {t("ready_to_download")}
            </Alert>

            <Box sx={{ marginBottom: (theme) => theme.spacing(2) }}>
              <Grid container spacing={1}>
                <Grid item>
                  <Button
                    disabled={activeStep === 0 || isEncrypting}
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
                    onClick={handleEncryptionRequest}
                    disabled={
                      isEncrypting ||
                      (!Password && !PublicKey && !PrivateKey) ||
                      !File
                    }
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
                      isEncrypting ? (
                        <CircularProgress
                          size={24}
                        />
                      ) : (
                        <LockOutlinedIcon />
                      )
                    }
                    fullWidth
                  >
                    {isEncrypting ? t("encrypting_file") : t("encrypt_file")}
                  </Button>
                </Grid>
              </Grid>
              <br />

              {isEncrypting && (
                <Alert variant="outlined" severity="info">
                  {t("page_close_alert_enc")}
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
            {t("success_encrypted")}
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
            <Grid item xs={12} sm={12}>
              <Button
                onClick={handleEncryptedFileDownload}
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
                    color: (theme) => theme.palette.custom?.mineShaft?.main || "#3f3f3f",
                    backgroundColor: (theme) => theme.palette.custom?.mercury?.light || "#f3f3f3",
                    "&:hover": {
                      backgroundColor: (theme) => theme.palette.custom?.mercury?.main || "#e9e9e9",
                    },
                    transition: "background-color 0.2s ease-out, color .01s",
                    textTransform: "none"
                  }}
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
                  title="Create a link that has your public key"
                  placement="bottom"
                >
                  <Button
                    onClick={() => createShareableLink()}
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
                {t("encrypt_another_file")}
              </Button>
            </Grid>

            {encryptionMethod === "publicKey" && shareableLink && (
              <TextField
                style={{ marginTop: 15 }}
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
};

export default LimitedEncryptionPanel;

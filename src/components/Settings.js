import { useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import SettingsIcon from "@mui/icons-material/Settings";
import Language from "../config/Language";
import { DarkMode } from "../config/Theme";
import { getTranslations as t } from "../../locales";
import Alert from "@mui/material/Alert";

const Settings = () => {
  const [open, setOpen] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <IconButton onClick={handleClickOpen}>
        <SettingsIcon />
      </IconButton>

      <Dialog
        maxWidth="sm"
        fullWidth
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        PaperProps={{
          elevation: 0,
        }}
        sx={{
          '& .MuiDialog-container': {
            alignItems: "start",
            marginTop: "20vh",
          },
        }}
      >
        <DialogTitle id="alert-dialog-title">{t('settings')}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {t('change_language')} :
          </DialogContentText>

          <Language />
          <Alert
          sx={{ marginBottom: (theme) => theme.spacing(2), marginTop: (theme) => theme.spacing(2) }}
          severity="info"
          action={
            <Button
              href="https://github.com/Voornaamenachternaam/hatsmith/blob/master/TRANSLATION.md"
              target="_blank"
            >
              {t("guide")}
            </Button>
          }
        >
          {t("help_translate")}
        </Alert>

          <DialogContentText
            id="alert-dialog-description"
            sx={{ marginTop: '15px' }}
          >
            {t('change_appearance')} :
          </DialogContentText>

          <DarkMode />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary" autoFocus>
            {t('close')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Settings;

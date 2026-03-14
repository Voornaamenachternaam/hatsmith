import { useState } from "react";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import { checkLocale } from "../../locales";
import { getTranslations as t } from "../../locales";
import locales from "../../locales/locales";

const Language = () => {
  const [language, setLanguage] = useState(checkLocale());

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem("language", e.target.value);
      window.location.reload(true);
    }
  };

  return (
    <>
      <FormControl
        variant="outlined"
        sx={{
          margin: (theme) => theme.spacing(1),
          minWidth: 120,
          padding: 0,
          '& .MuiOutlinedInput-root': {
            height: '40px',
            padding: '5px'
          }
        }}
      >
        <InputLabel>{t("language")}</InputLabel>
        <Select
          value={language}
          onChange={handleLanguageChange}
          label={t("language")}
        >
          {Object.entries(locales).map(([code, name]) => (
            <MenuItem key={code} value={code}>
              {name.language_name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </>
  );
};

export default Language;

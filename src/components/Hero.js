import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import { getTranslations as t } from "../../locales";
import VersionBadge from "./VersionBadge";
import { getCustom } from "../config/Theme";

export default function Hero() {
  return (
    <Container maxWidth="sm" component="main">
      <Typography
        variant="h5"
        align="center"
        gutterBottom
        sx={{
          color: (theme) => getCustom(theme).diamondBlack.main,
          marginTop: '20px',
        }}
      >
        {"Hatsmith"}<VersionBadge />
      </Typography>
      
      <Typography
        variant="subtitle1"
        align="center"
        component="p"
        sx={{
          color: (theme) => getCustom(theme).diamondBlack.main,
        }}
      >
        {t('sub_title')}
        <br />
      </Typography>
    </Container>
  );
}

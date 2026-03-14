import { currentVersion } from "../config/Constants";
import Chip from "@mui/material/Chip";
import { getCustom } from "../config/Theme";

const VersionBadge = () => {
  return (
    <Chip
      sx={{
        backgroundColor: (theme) => getCustom(theme).gallery.main,
        color: (theme) => getCustom(theme).mountainMist.main,
        borderRadius: ".25rem",
        padding: "none",
        marginLeft: '5px',
        marginBottom: 0,
      }}
      label={"v" + currentVersion}
      size="small"
    />
  );
};

export default VersionBadge;

import { currentVersion } from "../config/Constants";
import Chip from "@mui/material/Chip";

const VersionBadge = () => {
  return (
    <Chip
      sx={{
        backgroundColor: (theme) => theme.palette.custom?.gallery?.main || "#ebebeb",
        color: (theme) => theme.palette.custom?.mountainMist?.main || "#9791a1",
        borderRadius: ".25rem",
        padding: "none",
        marginLeft: "5px",
        marginBottom: 0,
      }}
      label={"v" + currentVersion}
      size="small"
    />
  );
};

export default VersionBadge;

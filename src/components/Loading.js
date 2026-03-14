import Backdrop from "@mui/material/Backdrop";
import { styled, keyframes } from "@mui/system";
import { getCustom } from "../config/Theme";

const spin = keyframes`
  100% {
    transform: rotateZ(360deg);
  }
`;

const bounce = keyframes`
  0% { transform: translateY(0) }
  50% { transform: translateY(-10px) }
  100% { transform: translateY(0) }
`;

const StyledBackdrop = styled(Backdrop)(({ theme }) => {
  const custom = getCustom(theme);
  return {
    backgroundColor: custom.alabaster.main,
    opacity: "96% !important",
    zIndex: 10,
    color: custom.mineShaft.main,
  };
});

const LoadingWrapper = styled('div')({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  position: "relative",
});

const Circle = styled('div')(({ theme }) => ({
  position: "absolute",
  width: 250,
  height: 250,
  border: "4px dashed",
  borderRadius: "50%",
  animation: `${spin} 5s linear infinite`,
}));

const LoadingImg = styled('img')({
  position: "absolute",
  width: 150,
  animation: `${bounce} 1.5s linear infinite`,
});

const LoadingText = styled('samp')({
  position: "absolute",
  bottom: "-60px", // Adjusted based on previous relative positioning
});

const LoadingCom = (props) => {
  return (
    <StyledBackdrop open={props.open}>
      <LoadingWrapper>
        <Circle />
        <LoadingImg
          src="/assets/images/logo_new.png"
          alt="Loading..."
        />
        <LoadingText>
            Loading...
        </LoadingText>
      </LoadingWrapper>
    </StyledBackdrop>
  );
};

export default LoadingCom;

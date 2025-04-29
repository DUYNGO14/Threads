export const modalContentStyles = {
  bg: "black",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  borderRadius: "0",
  maxW: "100vw",
  maxH: "100vh",
  overflow: "hidden",
};

export const modalBodyStyles = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  p: 0,
  w: "100vw",
  h: "100vh",
  position: "relative",
};

export const navButtonStyles = (pos) => ({
  position: "absolute",
  top: "50%",
  [pos]: "20px",
  transform: "translateY(-50%)",
  zIndex: 10,
  bg: "whiteAlpha.300",
  color: "white",
  borderRadius: "full",
  _hover: { bg: "whiteAlpha.500" },
});

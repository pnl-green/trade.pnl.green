import { Box } from "@mui/material";
import { ConnectWallet, darkTheme } from "@thirdweb-dev/react";

export default function WalletConnectModal() {
  return (
    <Box
      sx={{
        height: "40px",
        img: {
          width: "20px",
          height: "20px",
        },
      }}
    >
      <ConnectWallet
        modalSize={"compact"}
        showThirdwebBranding={false}
        hideSendButton={true}
        hideReceiveButton={true}
        hideSwitchToPersonalWallet={true}
        hideTestnetFaucet={true}
        btnTitle={"wallet connect"}
        modalTitleIconUrl={""}
        style={{
          width: "100%",
          height: "100%",
          color: "#fff",
        }}
        theme={darkTheme({
          colors: {
            primaryButtonBg: "#049260",
            primaryButtonText: "#fff",
            // skeletonBg: "#049260",
            accentButtonBg: "#049260",
          },
          fontFamily: "Sora",
        })}
      />
    </Box>
  );
}

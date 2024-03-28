import { ConnectWallet, darkTheme } from "@thirdweb-dev/react";

export default function WalletConnectModal() {
  return (
    <ConnectWallet
      modalSize={"compact"}
      showThirdwebBranding={false}
      hideSendButton={true}
      hideReceiveButton={true}
      hideSwitchToPersonalWallet={true}
      hideTestnetFaucet={true}
      btnTitle={"wallet connect"}
      theme={darkTheme({
        colors: {
          primaryButtonBg: "#049260",
          primaryButtonText: "#fff",
          skeletonBg: "#049260",
          accentButtonBg: "#049260",
        },
      })}
    />
  );
}

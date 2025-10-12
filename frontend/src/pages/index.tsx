// Landing page renders the primary trading PnL dashboard inside the shared layout.
import Layout from "@/components/layout";
import PnlComponent from "@/components/pnlComponent";
import { ReactElement } from "react";

export default function Home() {
  // Surface the trading experience; all data wiring happens inside the Pnl component.
  return <PnlComponent />;
}

Home.getLayout = function getLayout(page: ReactElement) {
  // Wrap this route with the application shell so headers/metadata stay consistent.
  return <Layout pageTitle="Pnl.Green">{page}</Layout>;
};

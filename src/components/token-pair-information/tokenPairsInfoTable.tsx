import {
  PairTableContainer,
  TokenPairsInfoTableWrapper,
  TokenTableTabsWrapper,
} from "@/styles/tokenPairs.styles";
import { Box, ClickAwayListener } from "@mui/material";
import React, { useRef, useState } from "react";

import StarBorderIcon from "@mui/icons-material/StarBorder";
import StarIcon from "@mui/icons-material/Star";

interface TokenPairsInfoTableProps {
  handleClose?: () => void;
  fav?: any;
  setFav?: any;
  id?: any;
  selectPairsToken?: any;
  setSelectPairsToken?: any;
}

export interface PairData {
  id: any;
  symbol: string;
  label: string;
  lastPrice: number;
  hr24change: string;
  changeIncrease: boolean;
  funding: string;
  volume: number;
  openInterest: number;
}

const pairDataArray: PairData[] = [
  {
    id: "1",
    symbol: "ETH-USD",
    label: "70X",
    lastPrice: 32000,
    hr24change: "-0.000396 / -2.14%",
    changeIncrease: false,
    funding: "0.012% 00.55.52",
    volume: 32000,
    openInterest: 32000,
  },

  {
    id: "2",
    symbol: "ETH-WIF",
    label: "70X",
    lastPrice: 32000,
    hr24change: "-0.000396 / -2.14%",
    changeIncrease: true,
    funding: "0.012% 00.55.52",
    volume: 32000,
    openInterest: 32000,
  },

  {
    id: "3",
    symbol: "ETH-BTC",
    label: "70X",
    lastPrice: 32000,
    hr24change: "-0.000396 / -2.14%",
    changeIncrease: false,
    funding: "0.012% 00.55.52",
    volume: 32000,
    openInterest: 32000,
  },
  {
    id: "4",
    symbol: "ETH-JUP",
    label: "70X",
    lastPrice: 32000,
    hr24change: "-0.000396 / -2.14%",
    changeIncrease: true,
    funding: "0.012% 00.55.52",
    volume: 32000,
    openInterest: 32000,
  },

  {
    id: "5",
    symbol: "ETH-JUP",
    label: "70X",
    lastPrice: 32000,
    hr24change: "-0.000396 / -2.14%",
    changeIncrease: true,
    funding: "0.012% 00.55.52",
    volume: 32000,
    openInterest: 32000,
  },
  {
    id: "6",
    symbol: "ETH-JUP",
    label: "70X",
    lastPrice: 32000,
    hr24change: "-0.000396 / -2.14%",
    changeIncrease: true,
    funding: "0.012% 00.55.52",
    volume: 32000,
    openInterest: 32000,
  },
  {
    id: "7",
    symbol: "ETH-JUP",
    label: "70X",
    lastPrice: 32000,
    hr24change: "-0.000396 / -2.14%",
    changeIncrease: true,
    funding: "0.012% 00.55.52",
    volume: 32000,
    openInterest: 32000,
  },
  {
    id: "8",
    symbol: "ETH-JUP",
    label: "70X",
    lastPrice: 32000,
    hr24change: "-0.000396 / -2.14%",
    changeIncrease: true,
    funding: "0.012% 00.55.52",
    volume: 32000,
    openInterest: 32000,
  },
  {
    id: "9",
    symbol: "ETH-JUP",
    label: "70X",
    lastPrice: 32000,
    hr24change: "-0.000396 / -2.14%",
    changeIncrease: true,
    funding: "0.012% 00.55.52",
    volume: 32000,
    openInterest: 32000,
  },
  {
    id: "10",
    symbol: "ETH-JUP",
    label: "70X",
    lastPrice: 32000,
    hr24change: "-0.000396 / -2.14%",
    changeIncrease: true,
    funding: "0.012% 00.55.52",
    volume: 32000,
    openInterest: 32000,
  },
];

//on click of star icon return the filled start else the outlined star
const FavButton = ({ fav, setFav, id }: TokenPairsInfoTableProps) => {
  const handleFavToggle = (id: any) => {
    const newFav = [...fav];
    const indexExists = newFav.indexOf(id) !== -1; //check if the id is already selected
    if (indexExists) {
      // Deselect the row
      setFav(newFav.filter((favIndex) => favIndex !== id));
    } else {
      // Select the row
      newFav.push(id);
      setFav(newFav);
    }
  };

  return (
    <span className="favButton" onClick={() => handleFavToggle(id)}>
      {fav.includes(id) ? (
        <StarIcon fontSize="small" sx={{ color: "#049260" }} />
      ) : (
        <StarBorderIcon fontSize="small" sx={{ color: "#FFFFFF99" }} />
      )}
    </span>
  );
};

const TokenPairsInfoTable = ({
  handleClose,
  selectPairsToken,
  setSelectPairsToken,
}: TokenPairsInfoTableProps) => {
  const [activeTab, setActiveTab] = useState("All"); // Default active tab
  const [fav, setFav] = useState<string[]>([]);

  const tabs = [
    "All",
    "DEX Only",
    "Trending",
    "Pre-launch",
    "Layer 1",
    "Defi",
    "Gaming",
    "Meme",
  ];

  const handleClickTab = (tabName: string) => {
    setActiveTab(tabName);
  };

  const handleSelectPairs = (data: any, event: any) => {
    if (event.target.tagName === "svg" || event.target.tagName === "path")
      return;
    setSelectPairsToken(data);
  };

  // Sort the pairDataArray based on whether they are favorited or not
  const sortedPairDataArray = [...pairDataArray].sort((a, b) => {
    const isAFav = fav.includes(a.id);
    const isBFav = fav.includes(b.id);
    if (isAFav && !isBFav) return -1;
    if (!isAFav && isBFav) return 1;
    return 0;
  });

  return (
    <ClickAwayListener onClickAway={() => handleClose?.()}>
      <TokenPairsInfoTableWrapper>
        <input placeholder="Search coins..." />
        <TokenTableTabsWrapper>
          {tabs.map((tabName) => (
            <button
              key={tabName}
              className={tabName === activeTab ? "active" : ""}
              onClick={() => handleClickTab(tabName)}
            >
              {tabName}
            </button>
          ))}
        </TokenTableTabsWrapper>

        <Box
          style={{
            maxHeight: "100%",
            overflowY: "auto",
            overflowX: "hidden",
          }}
        >
          <PairTableContainer>
            <thead
              style={{
                position: "sticky",
                top: "0",
                zIndex: "1",
                background: "#000000",
              }}
            >
              <tr>
                <th>Symbol</th>
                <th>Last Price</th>
                <th>24hr Change</th>
                <th>8hr Funding</th>
                <th>Volume</th>
                <th>Open Interest</th>
              </tr>
            </thead>
            <tbody>
              {sortedPairDataArray.map((pairData, index) => (
                <tr
                  key={index}
                  onClick={(event) => handleSelectPairs(pairData, event)}
                >
                  <td id="centered-content">
                    <FavButton fav={fav} setFav={setFav} id={pairData.id} />
                    <span>{pairData.symbol}</span>
                    <span className="greenBox">{pairData.label}</span>
                  </td>
                  <td>{pairData.lastPrice}</td>
                  <td
                    style={{
                      color: pairData.changeIncrease
                        ? "rgb(0, 255, 0)"
                        : "rgb(255, 0, 0)",
                    }}
                  >
                    {pairData.hr24change}
                  </td>
                  <td>{pairData.funding}</td>
                  <td>{pairData.volume}</td>
                  <td>{pairData.openInterest}</td>
                </tr>
              ))}
            </tbody>
          </PairTableContainer>
        </Box>
      </TokenPairsInfoTableWrapper>
    </ClickAwayListener>
  );
};

export default TokenPairsInfoTable;

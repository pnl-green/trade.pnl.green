import React from "react";
import { StyledTable, TradesRows } from "@/styles/orderbook.styles";
import { Box } from "@mui/material";

const Trades = () => {
  // Dummy data for demonstration
  const tradeData = [
    { price: 1.8547, size: 12.3, time: "13:42:05" },
    { price: 1.8523, size: 5.7, time: "13:40:05" },
    { price: 1.8547, size: 9.5, time: "13:42:05" },
    { price: 1.85, size: 7.8, time: "13:45:05" },
    { price: 1.8547, size: 11.1, time: "13:40:01" },
    { price: 1.8323, size: 12.3, time: "13:42:05" },
    { price: 1.7721, size: 10.7, time: "13:42:05" },

    { price: 1.8547, size: 12.3, time: "13:42:05" },
    { price: 1.8523, size: 5.7, time: "13:40:05" },
    { price: 1.8547, size: 9.5, time: "13:42:05" },
    { price: 1.85, size: 7.8, time: "13:45:05" },
    { price: 1.8547, size: 11.1, time: "13:40:01" },
    { price: 1.8323, size: 12.3, time: "13:42:05" },
    { price: 1.7721, size: 10.7, time: "13:42:05" },
    { price: 1.8547, size: 12.3, time: "13:42:05" },
    { price: 1.8523, size: 5.7, time: "13:40:05" },
    { price: 1.8547, size: 9.5, time: "13:42:05" },
    { price: 1.85, size: 7.8, time: "13:45:05" },
    { price: 1.8547, size: 11.1, time: "13:40:01" },
    { price: 1.8323, size: 12.3, time: "13:42:05" },
    { price: 1.7721, size: 10.7, time: "13:42:05" },
    { price: 1.8547, size: 12.3, time: "13:42:05" },
    { price: 1.8523, size: 5.7, time: "13:40:05" },
    { price: 1.8547, size: 9.5, time: "13:42:05" },
    { price: 1.85, size: 7.8, time: "13:45:05" },
    { price: 1.8547, size: 11.1, time: "13:40:01" },
    { price: 1.8323, size: 12.3, time: "13:42:05" },
    { price: 1.7721, size: 10.7, time: "13:42:05" },
    { price: 1.8547, size: 12.3, time: "13:42:05" },
    { price: 1.8523, size: 5.7, time: "13:40:05" },
    { price: 1.8547, size: 9.5, time: "13:42:05" },
    { price: 1.85, size: 7.8, time: "13:45:05" },
    { price: 1.8547, size: 11.1, time: "13:40:01" },
    { price: 1.8323, size: 12.3, time: "13:42:05" },
    { price: 1.7721, size: 10.7, time: "13:42:05" },
    // More trade data...
  ];

  const handleDetailsClick = (index: any) => {
    // Implement your logic here
    console.log("Clicked on details for index:", index);
  };

  return (
    <Box
      style={{
        marginTop: "10px",
        maxHeight: "100%",
        overflowY: "auto",
        overflowX: "hidden",
      }}
    >
      <StyledTable fontSize="13px">
        <thead
          style={{
            position: "sticky",
            top: "0",
            zIndex: "1",
            backgroundColor: "#131212",
          }}
        >
          <tr>
            <th>Price</th>
            <th>Size(ETH)</th>
            <th>Time</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {tradeData.map((trade, index) => (
            <TradesRows key={index} className="first-column">
              {Object.values(trade).map((data, idx) => (
                <td key={idx} className={idx === 0 ? "first-column" : ""}>
                  {data}
                </td>
              ))}
              <td
                className="details-icon"
                onClick={() => handleDetailsClick(index)}
              >
                <img src="/linkIcon.svg" alt="link" />
              </td>
            </TradesRows>
          ))}
        </tbody>
      </StyledTable>
    </Box>
  );
};

export default Trades;

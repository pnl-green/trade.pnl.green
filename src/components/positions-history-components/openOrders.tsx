import React from "react";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";

interface Column {
  id:
    | "time"
    | "type"
    | "coin"
    | "direction"
    | "size"
    | "originalPrice"
    | "orderValue"
    | "price"
    | "triggerCondition"
    | "tpsl";
  label: string;
  align?: "right" | "center" | "left";
}

const columns: Column[] = [
  { id: "time", label: "Time", align: "center" },
  { id: "type", label: "Type", align: "center" },
  { id: "coin", label: "Coin", align: "center" },
  { id: "direction", label: "Direction", align: "center" },
  { id: "size", label: "Size", align: "center" },
  { id: "originalPrice", label: "Original Price", align: "center" },
  { id: "orderValue", label: "Order Value", align: "center" },
  { id: "price", label: "Price", align: "center" },
  { id: "triggerCondition", label: "Trigger Condition", align: "center" },
  { id: "tpsl", label: "TP/SL", align: "center" },
];

const row: any[] = [
  //dummy data
  {
    time: "10:00",
    type: "Limit",
    coin: "BTC",
    direction: "Buy",
    size: "0.01",
    originalPrice: "0.01",
    orderValue: "0.01",
    price: "0.01",
    triggerCondition: "0.01",
    tpsl: "0.01",
  },
  {
    time: "10:00",
    type: "Limit",
    coin: "BTC",
    direction: "Buy",
    size: "0.01",
    originalPrice: "0.01",
    orderValue: "0.01",
    price: "0.01",
    triggerCondition: "0.01",
    tpsl: "0.01",
  },
  {
    time: "10:00",
    type: "Limit",
    coin: "BTC",
    direction: "Buy",
    size: "0.01",
    originalPrice: "0.01",
    orderValue: "0.01",
    price: "0.01",
    triggerCondition: "0.01",
    tpsl: "0.01",
  },
  {
    time: "10:00",
    type: "Limit",
    coin: "BTC",
    direction: "Buy",
    size: "0.01",
    originalPrice: "0.01",
    orderValue: "0.01",
    price: "0.01",
    triggerCondition: "0.01",
    tpsl: "0.01",
  },
  {
    time: "10:00",
    type: "Limit",
    coin: "BTC",
    direction: "Buy",
    size: "0.01",
    originalPrice: "0.01",
    orderValue: "0.01",
    price: "0.01",
    triggerCondition: "0.01",
    tpsl: "0.01",
  },
  {
    time: "10:00",
    type: "Limit",
    coin: "BTC",
    direction: "Buy",
    size: "0.01",
    originalPrice: "0.01",
    orderValue: "0.01",
    price: "0.01",
    triggerCondition: "0.01",
    tpsl: "0.01",
  },
  {
    time: "10:00",
    type: "Limit",
    coin: "BTC",
    direction: "Buy",
    size: "0.01",
    originalPrice: "0.01",
    orderValue: "0.01",
    price: "0.01",
    triggerCondition: "0.01",
    tpsl: "0.01",
  },
  {
    time: "10:00",
    type: "Limit",
    coin: "BTC",
    direction: "Buy",
    size: "0.01",
    originalPrice: "0.01",
    orderValue: "0.01",
    price: "0.01",
    triggerCondition: "0.01",
    tpsl: "0.01",
  },
  {
    time: "10:00",
    type: "Limit",
    coin: "BTC",
    direction: "Buy",
    size: "0.01",
    originalPrice: "0.01",
    orderValue: "0.01",
    price: "0.01",
    triggerCondition: "0.01",
    tpsl: "0.01",
  },
];

const OpenOrdersComponentTable = () => {
  return (
    <Paper
      sx={{
        width: "100%",
        overflow: "hidden",
        background: "transparent",
      }}
    >
      <TableContainer sx={{ maxHeight: 300, paddingBottom: "60px" }}>
        <Table stickyHeader aria-label="sticky table">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align}
                  sx={{
                    background: "#100e0e",
                    color: "white",
                    padding: "10px",
                    borderBottom: "2px solid rgba(255, 255, 255, 0.1)",
                  }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {row.map((row, index) => {
              return (
                <TableRow key={index}>
                  {columns.map((column) => {
                    const value = row[column.id];
                    return (
                      <TableCell
                        key={column.id}
                        align={column.align}
                        sx={{
                          background: "transparent",
                          color: "white",
                          padding: "8px",
                          border: "none",
                        }}
                      >
                        {value}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default OpenOrdersComponentTable;

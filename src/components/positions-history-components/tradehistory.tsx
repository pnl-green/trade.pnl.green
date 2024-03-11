import React from "react";
import {
  Box,
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
    | "coin"
    | "direction"
    | "price"
    | "size"
    | "tradeValue"
    | "fee"
    | "closedPNL";
  label: string;
  align?: "right" | "center" | "left";
}

const columns: Column[] = [
  { id: "time", label: "Time", align: "center" },
  { id: "coin", label: "Coin", align: "center" },
  { id: "direction", label: "Direction", align: "center" },
  { id: "price", label: "Price", align: "center" },
  { id: "size", label: "Size", align: "center" },
  { id: "tradeValue", label: "Trade Value", align: "center" },
  { id: "fee", label: "Fee", align: "center" },
  { id: "closedPNL", label: "Closed PNL", align: "center" },
];

const row: any[] = [];

const TradeHistoryComponentTable = () => {
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
            {row.length === 0 ? (
              <Box
                sx={{
                  color: "#fff",
                  fontFamily: "Sora",
                  fontWeight: "400",
                  fontSize: "13px",
                  p: "10px",
                }}
              >
                No trades yet
              </Box>
            ) : (
              <>
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
              </>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default TradeHistoryComponentTable;

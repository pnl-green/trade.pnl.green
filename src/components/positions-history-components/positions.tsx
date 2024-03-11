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
    | "coin"
    | "size"
    | "positionValue"
    | "entryPrice"
    | "markPrice"
    | "pnl"
    | "liqPrice"
    | "margin"
    | "funding"
    | "tpsl";
  label: string;
  align?: "right" | "center" | "left";
}

const columns: Column[] = [
  { id: "coin", label: "Coin", align: "center" },
  { id: "size", label: "Size", align: "center" },
  { id: "positionValue", label: "Position Value", align: "center" },
  { id: "entryPrice", label: "Entry Price", align: "center" },
  { id: "markPrice", label: "Mark Price", align: "center" },
  { id: "pnl", label: "PNL(ROE%)", align: "center" },
  { id: "liqPrice", label: "Liq Price", align: "center" },
  { id: "margin", label: "Margin", align: "center" },
  { id: "funding", label: "Funding", align: "center" },
  { id: "tpsl", label: "TP/SL", align: "center" },
];

const row: any[] = [];

const PositionComponentTable = () => {
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
                No open position yet
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

export default PositionComponentTable;

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
    | "type"
    | "coin"
    | "direction"
    | "size"
    | "originalSize"
    | "orderValue"
    | "price"
    | "triggerCondition"
    | "tpsl"
    | "status";
  label: string;
  align?: "right" | "center" | "left";
}

const columns: Column[] = [
  { id: "time", label: "Time", align: "center" },
  { id: "type", label: "Type", align: "center" },
  { id: "coin", label: "Coin", align: "center" },
  { id: "direction", label: "Direction", align: "center" },
  { id: "size", label: "Size", align: "center" },
  { id: "originalSize", label: "Original Size", align: "center" },
  { id: "orderValue", label: "Order Value", align: "center" },
  { id: "price", label: "Price", align: "center" },
  { id: "triggerCondition", label: "Trigger Condition", align: "center" },
  { id: "tpsl", label: "TP/SL", align: "center" },
  { id: "status", label: "Status", align: "center" },
];

const row: any[] = [];

const OrderHistoryComponentTable = () => {
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
                No orders history yet
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

export default OrderHistoryComponentTable;

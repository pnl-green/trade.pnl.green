import React from 'react';
import { Paper, Table, TableBody, TableHead } from '@mui/material';
import { useTradeHistoryContext } from '@/context/tradeHistoryContext';
import { timestampToDateTime } from '@/utils/toHumanReadableTime';
import {
  BodyCell,
  BodyRow,
  EmptyState,
  HeaderCell,
  HeaderRow,
  StyledTableContainer,
  TableShell,
} from './tableElements';

interface Column {
  id:
    | 'time'
    | 'coin'
    | 'direction'
    | 'price'
    | 'size'
    | 'tradeValue'
    | 'fee'
    | 'closedPNL';
  label: string;
  align?: 'right' | 'center' | 'left';
}

const columns: Column[] = [
  { id: 'time', label: 'Time', align: 'center' },
  { id: 'coin', label: 'Coin', align: 'center' },
  { id: 'direction', label: 'Direction', align: 'center' },
  { id: 'price', label: 'Price', align: 'center' },
  { id: 'size', label: 'Size', align: 'center' },
  { id: 'tradeValue', label: 'Trade Value', align: 'center' },
  { id: 'fee', label: 'Fee', align: 'center' },
  { id: 'closedPNL', label: 'Closed PNL', align: 'center' },
];

const TradeHistoryComponentTable = () => {
  //------use Context Hooks------
  const { tradeHistoryData, loadingTradeHistoryData } =
    useTradeHistoryContext();
  return (
    <TableShell component={Paper}>
      <StyledTableContainer>
        <Table stickyHeader aria-label="sticky table">
          <TableHead>
            <HeaderRow>
              {columns.map((column) => (
                <HeaderCell key={column.id} align={column.align}>
                  {column.label}
                </HeaderCell>
              ))}
            </HeaderRow>
          </TableHead>
          <TableBody>
            {loadingTradeHistoryData ? (
              <EmptyState>loading...</EmptyState>
            ) : !loadingTradeHistoryData && tradeHistoryData.length === 0 ? (
              <EmptyState>No open position yet</EmptyState>
            ) : !loadingTradeHistoryData && tradeHistoryData.length !== 0 ? (
              <>
                {tradeHistoryData.fills.map((row: any, index: any) => {
                  return (
                    <BodyRow key={index}>
                      <BodyCell align="center">{timestampToDateTime(row.time)}</BodyCell>
                      <BodyCell align="center">{row.coin}</BodyCell>
                      <BodyCell align="center">{row.dir}</BodyCell>
                      <BodyCell align="center">{row.px}</BodyCell>
                      <BodyCell align="center">{row.sz}</BodyCell>
                      <BodyCell align="center">{row.tradeValue ? '' : '- -'}</BodyCell>
                      <BodyCell align="center">{row.fee}</BodyCell>
                      <BodyCell align="center">{row.closedPnl}</BodyCell>
                    </BodyRow>
                  );
                })}
              </>
            ) : null}
          </TableBody>
        </Table>
      </StyledTableContainer>
    </TableShell>
  );
};

export default TradeHistoryComponentTable;

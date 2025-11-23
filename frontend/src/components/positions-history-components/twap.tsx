import React from 'react';
import { Box, Paper, Table, TableBody, TableHead } from '@mui/material';
import { useTwapHistoryContext } from '@/context/twapHistoryContext';
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
    | 'coin'
    | 'size'
    | 'executedSize'
    | 'averagePrice'
    | 'runningTimeTotal'
    | 'reduceOnly'
    | 'creationTime'
    | 'Terminate';
  label: string;
  align?: 'right' | 'center' | 'left';
}

const columns: Column[] = [
  { id: 'coin', label: 'Coin', align: 'center' },
  { id: 'size', label: 'Size', align: 'center' },
  { id: 'executedSize', label: 'Executed Size', align: 'center' },
  { id: 'averagePrice', label: 'Average Price', align: 'center' },
  { id: 'runningTimeTotal', label: 'Running Time/Total', align: 'center' },
  { id: 'reduceOnly', label: 'Reduce Only', align: 'center' },
  { id: 'creationTime', label: 'Creation Time', align: 'center' },
  { id: 'Terminate', label: 'Terminate', align: 'center' },
];

const TwapComponentTable = () => {
  //------use Context Hooks
  const { twapHistoryData, loadingTwapData } = useTwapHistoryContext();
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
            {loadingTwapData ? (
              <EmptyState>loading...</EmptyState>
            ) : !loadingTwapData && twapHistoryData.length === 0 ? (
              <EmptyState>No open position yet</EmptyState>
            ) : !loadingTwapData && twapHistoryData.length !== 0 ? (
              <>
                {twapHistoryData.history.map((row: any, index: any) => {
                  return (
                    <BodyRow key={index}>
                      {/* <TableCell>{timestampToDateTime(row.time)}</TableCell> */}
                      <BodyCell align="center">{row.state.coin}</BodyCell>
                      <BodyCell align="center">{row.state.sz}</BodyCell>
                      <BodyCell align="center">{row.state.executedSz}</BodyCell>
                      <BodyCell align="center">{'- -'}</BodyCell>
                      <BodyCell align="center">
                        {row.state.minutes === 60
                          ? '1 hour'
                          : row.state.minutes + ' minutes'}
                      </BodyCell>
                      <BodyCell align="center">
                        {row.state.reduceOnly ? 'Yes' : 'No'}
                      </BodyCell>
                      <BodyCell align="center">{'- -'}</BodyCell>
                      <BodyCell align="center">{'- -'}</BodyCell>
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

export default TwapComponentTable;

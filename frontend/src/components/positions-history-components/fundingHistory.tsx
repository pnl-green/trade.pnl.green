import React from 'react';
import { Paper, Table, TableBody, TableHead } from '@mui/material';
import { useFundingHistoryContext } from '@/context/fundingHistoryContext';
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
  id: 'time' | 'coin' | 'size' | 'direction' | 'payment' | 'rate';
  label: string;
  align?: 'right' | 'center' | 'left';
}

const columns: Column[] = [
  { id: 'time', label: 'Time', align: 'center' },
  { id: 'coin', label: 'Coin', align: 'center' },
  { id: 'size', label: 'Size', align: 'center' },
  { id: 'direction', label: 'Direction', align: 'center' },
  { id: 'payment', label: 'Payment', align: 'center' },
  { id: 'rate', label: 'Rate', align: 'center' },
];

const row: any[] = [];

const FundingHistoryComponentTable = () => {
  //------use Context Hooks-------
  const { loadingFundingHistoryData, fundingHistoryData } =
    useFundingHistoryContext();
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
            {loadingFundingHistoryData ? (
              <EmptyState>loading...</EmptyState>
            ) : !loadingFundingHistoryData && fundingHistoryData.length === 0 ? (
              <EmptyState>No open position yet</EmptyState>
            ) : !loadingFundingHistoryData &&
              fundingHistoryData.length !== 0 ? (
              <>
                {fundingHistoryData.fundings.map((row: any, index: any) => {
                  return (
                    <BodyRow key={index}>
                      <BodyCell align="center">{timestampToDateTime(row.time)}</BodyCell>
                      <BodyCell align="center">{row.coin}</BodyCell>
                      <BodyCell align="center">
                        {row.szi}&nbsp;{row.coin}
                      </BodyCell>
                      <BodyCell align="center">
                        {row.side === 'B'
                          ? 'Long'
                          : row.side === 'A'
                          ? 'Short'
                          : '- -'}
                      </BodyCell>
                      <BodyCell
                        align="center"
                        sx={{
                          color:
                            Number(row.usdc) < 0
                              ? '#E10000 !important'
                              : 'green !important',
                        }}
                      >
                        {`${row.usdc < 0 ? '-' : ''}$${Math.abs(
                          row.usdc
                        ).toFixed(4)}`}
                      </BodyCell>
                      <BodyCell align="center">{Number(row.fundingRate) + '%'}</BodyCell>
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

export default FundingHistoryComponentTable;

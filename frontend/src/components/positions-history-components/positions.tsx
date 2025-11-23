import React from 'react';
import { Paper, Table, TableBody, TableHead } from '@mui/material';
import { useWebDataContext } from '@/context/webDataContext';
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
    | 'positionValue'
    | 'entryPrice'
    | 'markPrice'
    | 'pnl'
    | 'liqPrice'
    | 'margin'
    | 'funding'
    | 'tpsl';
  label: string;
  align?: 'right' | 'center' | 'left';
}

const columns: Column[] = [
  { id: 'coin', label: 'Coin', align: 'center' },
  { id: 'size', label: 'Size', align: 'center' },
  { id: 'positionValue', label: 'Position Value', align: 'center' },
  { id: 'entryPrice', label: 'Entry Price', align: 'center' },
  { id: 'markPrice', label: 'Mark Price', align: 'center' },
  { id: 'pnl', label: 'PNL(ROE%)', align: 'center' },
  { id: 'liqPrice', label: 'Liq Price', align: 'center' },
  { id: 'margin', label: 'Margin', align: 'center' },
  { id: 'funding', label: 'Funding', align: 'center' },
  { id: 'tpsl', label: 'TP/SL', align: 'center' },
];

const PositionComponentTable = () => {
  const { webData2, loadingWebData2 } = useWebDataContext();

  const PositionsData = webData2.clearinghouseState?.assetPositions;

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
            {loadingWebData2 ? (
              <EmptyState>loading...</EmptyState>
            ) : (!loadingWebData2 && webData2.length === 0) || PositionsData.length === 0 ? (
              <EmptyState>No open position yet</EmptyState>
            ) : !loadingWebData2 &&
              webData2?.length !== 0 &&
              PositionsData.length !== 0 ? (
              <>
                {PositionsData?.map((row: any, index: any) => {
                  return (
                    <BodyRow key={index}>
                      <BodyCell align="center">{row.position.coin}</BodyCell>
                      <BodyCell align="center">{row.position.szi}</BodyCell>
                      <BodyCell align="center">{row.position.positionValue}</BodyCell>
                      <BodyCell align="center">{row.position.entryPx}</BodyCell>
                      <BodyCell align="center">{row.position.entryPx}</BodyCell>
                      <BodyCell align="center">{row.position.unrealizedPnl}</BodyCell>
                      <BodyCell align="center">{row.position.liquidationPx}</BodyCell>
                      <BodyCell align="center">{row.position.marginUsed}</BodyCell>
                      <BodyCell align="center">{row.position.cumFunding.allTime}</BodyCell>
                      <BodyCell align="center">{'--'}</BodyCell>
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

export default PositionComponentTable;

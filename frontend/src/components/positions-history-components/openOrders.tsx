import React from 'react';
import { Paper, Table, TableBody, TableHead } from '@mui/material';
import { useWebDataContext } from '@/context/webDataContext';
import { timestampToDateTime } from '../../../utils/toHumanReadableTime';
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
    | 'type'
    | 'coin'
    | 'direction'
    | 'size'
    | 'originalPrice'
    | 'orderValue'
    | 'price'
    | 'triggerCondition'
    | 'tpsl';
  label: string;
  align?: 'right' | 'center' | 'left';
}

const columns: Column[] = [
  { id: 'time', label: 'Time', align: 'center' },
  { id: 'type', label: 'Type', align: 'center' },
  { id: 'coin', label: 'Coin', align: 'center' },
  { id: 'direction', label: 'Direction', align: 'center' },
  { id: 'size', label: 'Size', align: 'center' },
  { id: 'originalPrice', label: 'Original Price', align: 'center' },
  { id: 'orderValue', label: 'Order Value', align: 'center' },
  { id: 'price', label: 'Price', align: 'center' },
  { id: 'triggerCondition', label: 'Trigger Condition', align: 'center' },
  { id: 'tpsl', label: 'TP/SL', align: 'center' },
];

const OpenOrdersComponentTable = () => {
  const { webData2, loadingWebData2 } = useWebDataContext();

  const openOrdersData = webData2.openOrders;
  console.log(openOrdersData)

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
            ) : (!loadingWebData2 && webData2.length === 0) || openOrdersData.length === 0 ? (
              <EmptyState>No open orders yet</EmptyState>
            ) : (
              <>
                {openOrdersData.map((row: any, index: any) => {
                  return (
                    <BodyRow key={index}>
                      <BodyCell align="center">
                        {timestampToDateTime(row.timestamp)}
                      </BodyCell>
                      <BodyCell align="center">{row.orderType}</BodyCell>
                      <BodyCell align="center">{row.coin}</BodyCell>
                      <BodyCell align="center">
                        {row.side === 'A' ? 'short' : 'Long'}
                      </BodyCell>
                      <BodyCell align="center">{row.sz}</BodyCell>
                      <BodyCell align="center">{row.origSz}</BodyCell>
                      <BodyCell align="center">{''}</BodyCell>
                      <BodyCell align="center">{row.limitPx}</BodyCell>
                      <BodyCell align="center">{row.triggerCondition}</BodyCell>
                      <BodyCell align="center">{'--'}</BodyCell>
                    </BodyRow>
                  );
                })}
              </>
            )}
          </TableBody>
        </Table>
      </StyledTableContainer>
    </TableShell>
  );
};

export default OpenOrdersComponentTable;

import React from 'react';
import { Paper, Table, TableBody, TableHead } from '@mui/material';
import { timestampToDateTime } from '@/utils/toHumanReadableTime';
import { useOrderHistoryContext } from '@/context/orderHistoryContext';
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
    | 'originalSize'
    | 'orderValue'
    | 'price'
    | 'triggerCondition'
    | 'tpsl'
    | 'status'
    | 'Order ID';
  label: string;
  align?: 'right' | 'center' | 'left';
}

const columns: Column[] = [
  { id: 'time', label: 'Time', align: 'center' },
  { id: 'type', label: 'Type', align: 'center' },
  { id: 'coin', label: 'Coin', align: 'center' },
  { id: 'direction', label: 'Direction', align: 'center' },
  { id: 'size', label: 'Size', align: 'center' },
  { id: 'originalSize', label: 'Original Size', align: 'center' },
  { id: 'orderValue', label: 'Order Value', align: 'center' },
  { id: 'price', label: 'Price', align: 'center' },
  { id: 'triggerCondition', label: 'Trigger Condition', align: 'center' },
  { id: 'tpsl', label: 'TP/SL', align: 'center' },
  { id: 'status', label: 'Status', align: 'center' },
  { id: 'Order ID', label: 'Order ID', align: 'center' },
];

const row: any[] = [];

const OrderHistoryComponentTable = () => {
  const { orderHistoryData, loadingOrderHistory } = useOrderHistoryContext();
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
            {loadingOrderHistory ? (
              <EmptyState>loading...</EmptyState>
            ) : !loadingOrderHistory && orderHistoryData.length === 0 ? (
              <EmptyState>No open position yet</EmptyState>
            ) : !loadingOrderHistory && orderHistoryData.length !== 0 ? (
              <>
                {orderHistoryData.orderHistory.map((row: any, index: any) => {
                  return (
                    <BodyRow key={index}>
                      <BodyCell align="center">
                        {timestampToDateTime(row.order.timestamp)}
                      </BodyCell>
                      <BodyCell align="center">{row.order.orderType}</BodyCell>
                      <BodyCell align="center">{row.order.coin}</BodyCell>
                      <BodyCell align="center">
                        {row.order.side === 'B' ? 'Long' : 'Short'}
                      </BodyCell>
                      <BodyCell align="center">{row.order.sz}</BodyCell>
                      <BodyCell align="center">{row.order.origSz}</BodyCell>
                      <BodyCell align="center">
                        {(Number(row.order.sz) * Number(row.order.limitPx)).toFixed(2)}
                      </BodyCell>
                      <BodyCell align="center">{row.order.limitPx}</BodyCell>
                      <BodyCell align="center">{row.order.triggerCondition}</BodyCell>
                      <BodyCell align="center">{'- -'}</BodyCell>
                      <BodyCell align="center">
                        {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                      </BodyCell>
                      <BodyCell align="center">{row.order.oid}</BodyCell>
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

export default OrderHistoryComponentTable;

import React from 'react';
import { styled } from '@mui/material';
import { intelayerColors, intelayerFonts } from '@/styles/theme';

interface DepthRow {
  price: string;
  size: string;
  total: string;
  widthPct: number;
  side: 'bid' | 'ask';
}

interface DepthTableProps {
  asks: DepthRow[];
  bids: DepthRow[];
  pairLabel: string;
  spreadValue: number;
  spreadPercent: number;
  loading?: boolean;
  emptyMessage?: string;
}

const Table = styled('table')(() => ({
  width: '100%',
  borderCollapse: 'collapse',
  fontFamily: intelayerFonts.body,
  fontSize: '12px',
}));

const HeaderCell = styled('th')(() => ({
  textAlign: 'right',
  padding: '6px 8px',
  color: intelayerColors.subtle,
  fontWeight: 500,
  fontSize: '11px',
}));

const Row = styled('tr')<{ side: 'bid' | 'ask'; widthPct: number }>(() => ({
  position: 'relative',
  transition: 'background 0.2s ease',
  '&:hover': {
    backgroundColor: 'rgba(20, 26, 35, 0.6)',
  },
}));

const Cell = styled('td')(() => ({
  textAlign: 'right',
  padding: '4px 8px',
  fontVariantNumeric: 'tabular-nums',
}));

const DepthBar = styled('span')<{ side: 'bid' | 'ask'; widthPct: number }>(
  ({ side, widthPct }) => ({
    position: 'absolute',
    inset: '2px 2px',
    width: `${Math.min(widthPct, 100)}%`,
    left: side === 'bid' ? 'auto' : 0,
    right: side === 'bid' ? 0 : 'auto',
    borderRadius: '4px',
    background:
      side === 'bid'
        ? `linear-gradient(90deg, rgba(21, 211, 128, 0.12), rgba(21, 211, 128, 0.32))`
        : `linear-gradient(90deg, rgba(245, 57, 88, 0.32), rgba(245, 57, 88, 0.12))`,
    transformOrigin: side === 'bid' ? 'right center' : 'left center',
  })
);

const SpreadRow = styled('tr')(() => ({
  textAlign: 'right',
  color: intelayerColors.muted,
  fontSize: '11px',
}));

const EmptyState = styled('div')(() => ({
  padding: '16px',
  textAlign: 'center',
  color: intelayerColors.muted,
  fontFamily: intelayerFonts.body,
}));

const DepthTable: React.FC<DepthTableProps> = ({
  asks,
  bids,
  pairLabel,
  spreadValue,
  spreadPercent,
  loading,
  emptyMessage = 'No order book data',
}) => {
  if (loading) {
    return <EmptyState>Loading order book…</EmptyState>;
  }

  if (!asks.length && !bids.length) {
    return <EmptyState>{emptyMessage}</EmptyState>;
  }

  return (
    <Table>
      <thead>
        <tr>
          <HeaderCell>Price</HeaderCell>
          <HeaderCell>{`Size (${pairLabel})`}</HeaderCell>
          <HeaderCell>{`Total (${pairLabel})`}</HeaderCell>
        </tr>
      </thead>
      <tbody>
        {asks.map((row, index) => (
          <Row key={`ask-${index}`} side="ask" widthPct={row.widthPct}>
            <DepthBar side="ask" widthPct={row.widthPct} />
            <Cell style={{ color: intelayerColors.red[500] }}>{row.price}</Cell>
            <Cell>{row.size}</Cell>
            <Cell>{row.total}</Cell>
          </Row>
        ))}
        <SpreadRow>
          <Cell colSpan={3}>
            Spread: {spreadValue} ({spreadPercent}%)
          </Cell>
        </SpreadRow>
        {bids.map((row, index) => (
          <Row key={`bid-${index}`} side="bid" widthPct={row.widthPct}>
            <DepthBar side="bid" widthPct={row.widthPct} />
            <Cell style={{ color: intelayerColors.green[500] }}>{row.price}</Cell>
            <Cell>{row.size}</Cell>
            <Cell>{row.total}</Cell>
          </Row>
        ))}
      </tbody>
    </Table>
  );
};

export default DepthTable;

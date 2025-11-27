import React, { useEffect, useRef } from 'react';
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
  sizeLabel: string;
  totalLabel: string;
  spreadValue: number;
  spreadPercent: number;
  loading?: boolean;
  emptyMessage?: string;
}

const Table = styled('div')(() => ({
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  fontFamily: intelayerFonts.body,
  fontSize: '12px',
  flex: 1,
  height: '100%',
  minHeight: 0,
}));

const HeaderRow = styled('div')(() => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: '8px',
  padding: '6px 8px',
  color: intelayerColors.subtle,
  fontWeight: 500,
  fontSize: '11px',
  textAlign: 'right',
}));

const DepthRow = styled('div')(() => ({
  position: 'relative',
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: '8px',
  padding: '0 8px',
  borderRadius: '6px',
  fontVariantNumeric: 'tabular-nums',
  textAlign: 'right',
  overflow: 'hidden',
  transition: 'background 0.2s ease',
  height: '32px',
  alignItems: 'center',
  '&:hover': {
    backgroundColor: 'rgba(20, 26, 35, 0.6)',
  },
}));

const Body = styled('div')(() => ({
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
}));

const DepthBar = styled('span')<{ side: 'bid' | 'ask'; widthPct: number }>(
  ({ side, widthPct }) => ({
    position: 'absolute',
    inset: 0,
    width: `${Math.min(widthPct, 100)}%`,
    left: side === 'bid' ? 'auto' : 0,
    right: side === 'bid' ? 0 : 'auto',
    borderRadius: '4px',
    background:
      side === 'bid'
        ? `linear-gradient(90deg, rgba(21, 211, 128, 0.08), rgba(21, 211, 128, 0.22))`
        : `linear-gradient(90deg, rgba(245, 57, 88, 0.22), rgba(245, 57, 88, 0.08))`,
    willChange: 'width',
    pointerEvents: 'none',
  })
);

const Cell = styled('span')(() => ({
  position: 'relative',
  zIndex: 1,
}));

const SpreadRow = styled('div')(() => ({
  padding: '0 8px',
  textAlign: 'right',
  color: intelayerColors.muted,
  fontSize: '11px',
  height: '32px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
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
  sizeLabel,
  totalLabel,
  spreadValue,
  spreadPercent,
  loading,
  emptyMessage = 'No order book data',
}) => {
  const centerRef = useRef<HTMLDivElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (centerRef.current && bodyRef.current) {
      const body = bodyRef.current;
      const center = centerRef.current;
      const offset =
        center.offsetTop - body.clientHeight / 2 + center.clientHeight / 2;
      body.scrollTop = Math.max(offset, 0);
    }
  }, [asks.length, bids.length]);

  if (loading) {
    return <EmptyState>Loading order book…</EmptyState>;
  }

  if (!asks.length && !bids.length) {
    return <EmptyState>{emptyMessage}</EmptyState>;
  }

  return (
    <Table>
      <HeaderRow>
        <span>Price</span>
        <span>{sizeLabel}</span>
        <span>{totalLabel}</span>
      </HeaderRow>
      <Body ref={bodyRef}>
        {asks.map((row, index) => (
          <DepthRow key={`ask-${index}`}>
            <DepthBar side="ask" widthPct={row.widthPct} />
            <Cell style={{ color: intelayerColors.red[500] }}>{row.price}</Cell>
            <Cell>{row.size}</Cell>
            <Cell>{row.total}</Cell>
          </DepthRow>
        ))}
        <SpreadRow ref={centerRef}>
          Spread: {spreadValue} ({spreadPercent}%)
        </SpreadRow>
        {bids.map((row, index) => (
          <DepthRow key={`bid-${index}`}>
            <DepthBar side="bid" widthPct={row.widthPct} />
            <Cell style={{ color: intelayerColors.green[500] }}>{row.price}</Cell>
            <Cell>{row.size}</Cell>
            <Cell>{row.total}</Cell>
          </DepthRow>
        ))}
      </Body>
    </Table>
  );
};

export default DepthTable;

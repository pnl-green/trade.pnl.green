import { Box, BoxProps, styled } from '@mui/material';
import React from 'react';
import { intelayerColors, intelayerFonts } from '@/styles/theme';

interface PanelCardProps extends BoxProps {
  title?: React.ReactNode;
  toolbar?: React.ReactNode;
  noPadding?: boolean;
  compact?: boolean;
  hideHeader?: boolean;
}

const PanelCardRoot = styled(Box)(() => ({
  backgroundColor: '#0b0f17',
  borderRadius: '12px',
  border: '1px solid rgba(255, 255, 255, 0.06)',
  padding: '12px',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  minHeight: 0,
  boxShadow: '0 10px 28px rgba(0, 0, 0, 0.28)',
}));

const PanelCardHeader = styled('header')(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '10px',
  color: intelayerColors.ink,
  fontFamily: intelayerFonts.heading,
  fontSize: '13px',
  fontWeight: 600,
}));

const PanelCard: React.FC<PanelCardProps> = ({
  title,
  toolbar,
  noPadding,
  compact,
  hideHeader,
  children,
  sx,
  ...rest
}) => {
  return (
    <PanelCardRoot
      {...rest}
      sx={{
        padding: noPadding ? 0 : compact ? '10px' : '12px',
        ...sx,
      }}
    >
      {(title || toolbar) && !hideHeader && (
        <PanelCardHeader>
          <Box component="span">{title}</Box>
          {toolbar && <Box component="div">{toolbar}</Box>}
        </PanelCardHeader>
      )}
      <Box sx={{ flex: 1, minHeight: 0 }}>{children}</Box>
    </PanelCardRoot>
  );
};

export default PanelCard;

import { Box, BoxProps, styled } from '@mui/material';
import { intelayerColors, intelayerFonts } from '@/styles/theme';
import React from 'react';

const PanelRoot = styled(Box)(() => ({
  backgroundColor: intelayerColors.surface,
  border: `1px solid ${intelayerColors.panelBorder}`,
  borderRadius: '12px',
  padding: '16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  minHeight: 0,
}));

const PanelHeader = styled('header')(() => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  color: intelayerColors.ink,
  fontFamily: intelayerFonts.heading,
  fontSize: '15px',
  fontWeight: 500,
}));

interface PanelProps extends BoxProps {
  title?: React.ReactNode;
  toolbar?: React.ReactNode;
  noPadding?: boolean;
}

const Panel: React.FC<PanelProps> = ({
  title,
  toolbar,
  noPadding,
  children,
  sx,
  ...rest
}) => {
  return (
    <PanelRoot
      {...rest}
      sx={{
        padding: noPadding ? 0 : '16px',
        ...sx,
      }}
    >
      {(title || toolbar) && (
        <PanelHeader>
          <Box component="span">{title}</Box>
          {toolbar && <Box component="div">{toolbar}</Box>}
        </PanelHeader>
      )}
      <Box sx={{ flex: 1, minHeight: 0 }}>{children}</Box>
    </PanelRoot>
  );
};

export default Panel;

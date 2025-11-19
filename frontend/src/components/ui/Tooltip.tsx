import React, { ReactElement, useId, useState } from 'react';
import { styled } from '@mui/material';
import { intelayerColors, intelayerFonts } from '@/styles/theme';

const TooltipWrapper = styled('span')(() => ({
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
}));

const TooltipBubble = styled('div')(() => ({
  position: 'absolute',
  bottom: 'calc(100% + 8px)',
  left: '50%',
  transform: 'translateX(-50%)',
  backgroundColor: intelayerColors.elev,
  color: intelayerColors.ink,
  border: `1px solid ${intelayerColors.panelBorder}`,
  borderRadius: '8px',
  padding: '10px 12px',
  fontSize: '12px',
  fontFamily: intelayerFonts.body,
  maxWidth: '260px',
  lineHeight: 1.4,
  pointerEvents: 'none',
  boxShadow: '0 12px 24px rgba(0,0,0,0.45)',
  zIndex: 20,
  opacity: 0,
  visibility: 'hidden',
  transition: 'opacity 0.15s ease, visibility 0.15s ease',
  '&::after': {
    content: "''",
    position: 'absolute',
    width: 0,
    height: 0,
    borderLeft: '6px solid transparent',
    borderRight: '6px solid transparent',
    borderTop: `6px solid ${intelayerColors.elev}`,
    bottom: -6,
    left: 'calc(50% - 6px)',
  },
  '&[data-visible="true"]': {
    opacity: 1,
    visibility: 'visible',
  },
}));

interface TooltipProps {
  content: string;
  children: ReactElement;
}

const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
  const tooltipId = useId();
  const [visible, setVisible] = useState(false);

  const childProps = {
    'aria-describedby': tooltipId,
    onFocus: (event: React.FocusEvent<HTMLElement>) => {
      children.props.onFocus?.(event);
      setVisible(true);
    },
    onBlur: (event: React.FocusEvent<HTMLElement>) => {
      children.props.onBlur?.(event);
      setVisible(false);
    },
    onMouseEnter: (event: React.MouseEvent<HTMLElement>) => {
      children.props.onMouseEnter?.(event);
      setVisible(true);
    },
    onMouseLeave: (event: React.MouseEvent<HTMLElement>) => {
      children.props.onMouseLeave?.(event);
      setVisible(false);
    },
  } as const;

  return (
    <TooltipWrapper>
      {React.cloneElement(children, childProps)}
      <TooltipBubble role="tooltip" id={tooltipId} data-visible={visible}>
        {content}
      </TooltipBubble>
    </TooltipWrapper>
  );
};

export default Tooltip;

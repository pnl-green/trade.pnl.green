import { InputBox } from '@/styles/riskManager.styles';
import { Box } from '@mui/material';
import React, { useRef } from 'react';
import Tooltip from '../ui/Tooltip';

interface inputProps {
  placeholder?: string | '';
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
  tooltip?: string;
}

interface inputBoxProps extends inputProps {
  styles?: React.CSSProperties | any;
  type?: string;
}

export const RenderInput = ({
  label,
  placeholder,
  type,
  value,
  onChange,
  styles,
  tooltip,
}: inputBoxProps) => {
  const ref: any = useRef(null);

  const handleHover = () => {
    ref.current.focus();
  };

  const handleMouseLeave = () => {
    ref.current.blur();
  };

  return (
    <InputBox
      onMouseEnter={handleHover}
      onMouseLeave={handleMouseLeave}
      onClick={handleHover}
      sx={styles}
    >
      {tooltip ? (
        <Tooltip content={tooltip}>
          <Box className="placeholder_box">{label}</Box>
        </Tooltip>
      ) : (
        <Box className="placeholder_box">{label}</Box>
      )}
      <input
        type={type}
        ref={ref}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    </InputBox>
  );
};

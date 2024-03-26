import { InputBox } from "@/styles/riskManager.styles";
import { Box } from "@mui/material";
import React, { useRef } from "react";

interface inputProps {
  placeholder?: string | "";
  value?: string;
  onChange?: any;
  label: string;
}

interface inputBoxProps extends inputProps {
  styles?: any;
}

export const RenderInput = ({
  label,
  placeholder,
  value,
  onChange,
  styles,
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
      sx={styles}
    >
      <Box className="placeholder_box">{label}</Box>
      <input
        ref={ref}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    </InputBox>
  );
};

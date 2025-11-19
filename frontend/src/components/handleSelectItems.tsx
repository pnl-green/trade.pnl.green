import React from 'react';
import { ItemsSelect } from '@/styles/common.styles';
import { intelayerColors } from '@/styles/theme';

const selectVariants = {
  surface: {
    backgroundColor: intelayerColors.surface,
    borderColor: intelayerColors.panelBorder,
    color: intelayerColors.ink,
  },
  elev: {
    backgroundColor: intelayerColors.elev,
    borderColor: intelayerColors.gray[600],
    color: intelayerColors.ink,
  },
  muted: {
    backgroundColor: intelayerColors.gray[700],
    borderColor: intelayerColors.gray[500],
    color: intelayerColors.ink,
  },
} as const;

type SelectVariant = keyof typeof selectVariants;

export interface HandleSelectProps {
  selectItem: any;
  setSelectItem: React.Dispatch<React.SetStateAction<any>>;
  selectDataItems: string[];
  styles?: React.CSSProperties;
  className?: string;
  toLowerCase?: boolean;
  variant?: SelectVariant;
}

const HandleSelectItems = ({
  selectItem,
  setSelectItem,
  selectDataItems,
  styles,
  className,
  toLowerCase,
  variant = 'surface',
}: HandleSelectProps) => {
  return (
    <ItemsSelect
      sx={{
        ...selectVariants[variant],
        ...styles,
      }}
      value={selectItem}
      onChange={(e) => setSelectItem(e.target.value)}
      className={className}
    >
      {selectDataItems?.map((value, index) => (
        <option key={index} value={value}>
          {toLowerCase ? value : value.toUpperCase()}
        </option>
      ))}
    </ItemsSelect>
  );
};

export default HandleSelectItems;

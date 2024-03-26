import React from "react";
import { ItemsSelect } from "@/styles/common.styles";

export interface HandleSelectProps {
  selectItem: any;
  setSelectItem: any;
  selectDataItems: string[];
  styles?: React.CSSProperties;
}

const HandleSelectItems = ({
  selectItem,
  setSelectItem,
  selectDataItems,
  styles,
}: HandleSelectProps) => {
  return (
    <ItemsSelect
      sx={styles}
      value={selectItem}
      onChange={(e) => setSelectItem(e.target.value)}
    >
      {selectDataItems.map((value, index) => (
        <option key={index} value={value}>
          {value}
        </option>
      ))}
    </ItemsSelect>
  );
};

export default HandleSelectItems;

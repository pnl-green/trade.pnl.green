import React from "react";
import { MenuItem } from "@mui/material";
import { SelectItems } from "@/styles/common.styles";

export interface HandleSelectProps {
  selectItem: string;
  setSelectItem: any;
  menuItemPlaceholder?: string;
  selectDataItems: string[];
}

const HandleSelectItems = ({
  selectItem,
  setSelectItem,
  menuItemPlaceholder,
  selectDataItems,
}: HandleSelectProps) => {
  return (
    <SelectItems
      value={selectItem}
      onChange={(e) => setSelectItem(e.target.value)}
      displayEmpty
    >
      <MenuItem value="" disabled>
        {menuItemPlaceholder}
      </MenuItem>
      {selectDataItems?.map((item: any, index: any) => (
        <MenuItem key={index} value={item}>
          {item}
        </MenuItem>
      ))}
    </SelectItems>
  );
};

export default HandleSelectItems;

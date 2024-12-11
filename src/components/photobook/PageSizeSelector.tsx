import React, { useState } from "react";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from "@mui/material";


export interface PageSize {
    label: string;
    size: {
        cssPageSize: string;
        width: number;
        height: number;
    }
}
// Define an array of page sizes
export const pageSizes = [
  { label: "A4 Landscape", size: { cssPageSize: 'a4 landscape', width: 297, height: 210 } },
  { label: "A5 Landscape", size: { cssPageSize: 'a5 landscape', width: 210, height: 148 } },
  { label: "A6 Landscape", size: { cssPageSize: 'a6 landscape', width: 148, height: 105 } },
  { label: "A4 Portrait", size: { cssPageSize: 'a4', width: 210, height: 297 } },
  { label: "A5 Portrait", size: { cssPageSize: 'a5', width: 148, height: 210 } },
  { label: "A6 Portrait", size: { cssPageSize: 'a6', width: 105, height: 148 } },
  { label: "Letter Landscape", size: { cssPageSize: 'a4 landscape', width: 216, height: 279 } },
  { label: "Legal Landscape", size: { cssPageSize: 'a4 landscape', width: 216, height: 356 } },
];

export const defaultPageSize = pageSizes[0];

function PageSizeSelector(props: {
  selectedSize: PageSize;
  onSelect: (size: PageSize) => void;
}) {
  // State to manage selected page size
    // const [selectedSize, setSelectedSize] = useState("A4");
    


  // Handle the selection change
  const handleChange = (event: SelectChangeEvent<string>) => {
    const selected = event.target.value;
    // setSelectedSize(selected);
    // Find the selected page size object to return
    const selectedPageSize = pageSizes.find((size) => size.label === selected);
    console.log(selectedPageSize); // You can return or use this object as needed
    if (selectedPageSize) {
      props.onSelect(selectedPageSize);
    }
  };

  return (
    <FormControl fullWidth>
      <InputLabel id="page-size-select-label">Select Page Size</InputLabel>
      <Select
        labelId="page-size-select-label"
        value={props.selectedSize.label}
        onChange={handleChange}
      >
        {pageSizes.map((size) => (
          <MenuItem key={size.label} value={size.label}>
            {size.label} ({size.size.width} mm x {size.size.height} mm)
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

export default PageSizeSelector;

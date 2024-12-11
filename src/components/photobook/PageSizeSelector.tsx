import React, { useState } from "react";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from "@mui/material";

// Define an array of page sizes
const pageSizes = [
  { label: "A4", size: { width: 210, height: 297 } },
  { label: "A5", size: { width: 148, height: 210 } },
  { label: "A6", size: { width: 105, height: 148 } },
  { label: "Letter", size: { width: 216, height: 279 } },
  { label: "Legal", size: { width: 216, height: 356 } },
];

function PageSizeSelector(props: {
  onSelect: (size: {
    label: string;
    size: { width: number; height: number };
  }) => void;
}) {
  // State to manage selected page size
  const [selectedSize, setSelectedSize] = useState("A4");

  // Handle the selection change
  const handleChange = (event: SelectChangeEvent<string>) => {
    const selected = event.target.value;
    setSelectedSize(selected);
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
        value={selectedSize}
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

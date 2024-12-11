import React, { useState, useEffect } from "react";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from "@mui/material";
import { Family, Person } from "../../api/model";
import { displayName } from "../../utils/name";

interface ResponseFamily {
  family: Family;
  husband: Person;
  wife: Person;
}

function FamilySelector(props: {
  onSelect: (family: Family | undefined) => void;
  selectedFamilyGrampsId: string | undefined;
}) {
  // Get the query parameter name 'url' from the current URL

  const [families, setFamilies] = useState([] as ResponseFamily[]);
  const [selectedFamily, setSelectedFamily] = useState("");

  useEffect(() => {
    if (props.selectedFamilyGrampsId) {
      setSelectedFamily(props.selectedFamilyGrampsId);
    }
  }, [props.selectedFamilyGrampsId]);

  // Fetch families from the server
  useEffect(() => {
    if (families.length === 0) {
      console.log("Search location", window.location.search);
      const clientUrl = new URLSearchParams(window.location.search).get("url");
      console.log("Fetching families from", `${clientUrl}/families`);
      fetch(`${clientUrl}/families`)
        .then((response) => response.json())
        .then((data) => setFamilies(data))
        .catch((error) => console.error("Error fetching families:", error));
    }
  }, []);

  const handleChange = (event: SelectChangeEvent<string>) => {
    setSelectedFamily(event.target.value);
    props.onSelect(
      families
        .map((family) => family.family)
        .find((family) => family.gramps_id === event.target.value),
    );
  };

  return (
    <FormControl fullWidth>
      <InputLabel id="family-selector-label">Family</InputLabel>
      <Select
        labelId="family-selector-label"
        id="family-selector"
        value={selectedFamily}
        label="Family"
        onChange={handleChange}
      >
        {families.map((family) => (
          <MenuItem
            key={family.family.gramps_id}
            value={family.family.gramps_id}
          >
            {family.family.gramps_id} -{" "}
            {family.husband
              ? displayName(family.husband.primary_name)
              : "Unknown"}{" "}
            & {family.wife ? displayName(family.wife.primary_name) : "Unknown"}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

export default FamilySelector;

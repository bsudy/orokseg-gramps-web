import { createRef, useEffect, useState } from "react";
import { Family, Media, MediaRef, Person } from "../api/model";
import { useNavigate, useParams } from "react-router-dom";
import { PhotoBook } from "../components/PhotoBook";
import { Box, Button, TextField, Typography } from "@mui/material";
import { PBFamily, PBMediumRef, PBPerson, PBTreeData } from "./photoBookModel";
import { FmdBad, People } from "@mui/icons-material";
import { tree } from "d3-hierarchy";
import FamilySelector from "../components/photobook/FamilySelector";
import PageSizeSelector, {
  defaultPageSize,
  PageSize,
} from "../components/photobook/PageSizeSelector";
import React from "react";
import { TreeBuilder } from "../model/tree";

export type PhotoBookParams = {
  famGrampsId: string;
};

export function PhotoBookPage() {
  // Get the query parameter name 'url' from the current URL
  const clientUrl = new URLSearchParams(window.location.search).get("url");

  const { famGrampsId } = useParams<PhotoBookParams>();
  const navigate = useNavigate();
  // const [selectedFamGrampsId, setSelectedFamGrampsId] = useState(famGrampsId);
  const [selectedPageSize, setSelectedPageSize] = useState(defaultPageSize);
  const [marginSide, setMarginSide] = useState(0);
  const [marginTopBottom, setMarginTopBottom] = useState(0);
  const [binding, setBleach] = useState(0);
  const photoBookRef = createRef<HTMLDivElement>();

  useEffect(() => {
    if (photoBookRef.current) {
      photoBookRef.current.style.setProperty(
        "--page-size",
        `${selectedPageSize.size.cssPageSize}`,
      );
      photoBookRef.current.style.setProperty(
        "--page-width",
        `${selectedPageSize.size.width}mm`,
      );
      photoBookRef.current.style.setProperty(
        "--page-height",
        `${selectedPageSize.size.height}mm`,
      );
      photoBookRef.current.style.setProperty(
        "--page-margin-in",
        `${marginSide + binding}mm`,
      );
      photoBookRef.current.style.setProperty(
        "--page-margin-out",
        `${marginSide}mm`,
      );
      photoBookRef.current.style.setProperty(
        "--page-margin-top",
        `${marginTopBottom}mm`,
      );
      photoBookRef.current.style.setProperty(
        "--page-margin-bottom",
        `${marginTopBottom}mm`,
      );
    }
  }, [selectedPageSize, photoBookRef, marginSide, binding, marginTopBottom]);

  const [treeData, setTreeData] = useState({
    families: [],
    people: [],
    familiesToDisplay: [],
  } as PBTreeData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null as unknown | null);

  const selectFamily = (family: Family | undefined) => {
    // change navigation to the selected family
    if (family) {
      navigate(`/families/${family?.gramps_id}/book${window.location.search}`);
    }
  };

  const generate = async (
    famGrampsId: string | undefined,
    down: number,
    up: number,
  ) => {
    if (!famGrampsId) {
      console.error("No family id");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      setTreeData({ families: [], people: [], familiesToDisplay: [] });
      if (!clientUrl) {
        throw new Error("No client URL");
      }

      const treeData = await new TreeBuilder(clientUrl).generate(
        famGrampsId,
        down,
        up,
      );
      setTreeData(treeData);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  const [title, setTitle] = useState("Photo Book");
  const [generationUp, setGenerationUp] = useState(4);
  const [generationDown, setGenerationDown] = useState(2);

  return (
    <div>
      <div className="photoBook-header">
        <Typography variant="h1">Photo Book</Typography>
        {/* A number input field for the generation from Material UI */}
        <Box sx={{ display: "flex", flexDirection: "column" }}>
          <FamilySelector
            onSelect={selectFamily}
            selectedFamilyGrampsId={famGrampsId}
          />

          <Box sx={{ display: "flex", alignItems: "center", margin: "1em 0" }}>
            <PageSizeSelector
              onSelect={setSelectedPageSize}
              selectedSize={selectedPageSize}
            />
            <TextField
              type="number"
              label="Margin side"
              value={marginSide}
              onChange={(e) => setMarginSide(parseInt(e.target.value))}
            />
            <TextField
              type="number"
              label="Margin top/bottom"
              value={marginTopBottom}
              onChange={(e) => setMarginTopBottom(parseInt(e.target.value))}
            />
            <TextField
              type="number"
              label="Binding"
              value={binding}
              onChange={(e) => setBleach(parseInt(e.target.value))}
            />
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", margin: "1em 0" }}>
            <TextField
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <TextField
              type="number"
              label="Generation up"
              value={generationUp}
              onChange={(e) => setGenerationUp(parseInt(e.target.value))}
            />
            <TextField
              type="number"
              label="Generation down"
              value={generationDown}
              onChange={(e) => setGenerationDown(parseInt(e.target.value))}
            />
            <Button
              onClick={() =>
                generate(famGrampsId, generationDown, generationUp)
              }
              variant="contained"
            >
              Generate
            </Button>
          </Box>
        </Box>
      </div>

      <div className="photoBook" ref={photoBookRef}>
        {loading && <div>Loading...</div>}
        {!!error && <div>Error: {`${error}`}</div>}

        {!error && !loading && <PhotoBook treeData={treeData} title={title} />}
      </div>
    </div>
  );
}

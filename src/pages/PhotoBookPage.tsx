import { createRef, useEffect, useState } from "react";
import { Family, Media, MediaRef, Person } from "../api/model";
import { useNavigate, useParams } from "react-router-dom";
import { PhotoBook } from "../components/PhotoBook";
import {
  Alert,
  Box,
  Button,
  Container,
  TextField,
  Typography,
} from "@mui/material";
import { PBFamily, PBMediumRef, PBPerson, PBTreeData } from "./photoBookModel";
import { AutoStories, FmdBad, People, Print } from "@mui/icons-material";
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
  const [error, setError] = useState(null as string | null);

  const isLoaded = !loading && !error && treeData.familiesToDisplay.length > 0;

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
      console.error(e);
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const [title, setTitle] = useState("Photo Book");
  const [generationUp, setGenerationUp] = useState(4);
  const [generationDown, setGenerationDown] = useState(2);

  return (
    <div>
      <Container maxWidth="sm" className="photoBook-header">
        <Box display="flex" flexDirection="column" alignItems="center">
          <img src="/logo.png" alt="Örökség Logo" style={{ width: "50%" }} />
          <Typography
            component="h1"
            variant="h2"
            align="center"
            color="textPrimary"
            gutterBottom
          >
            Photo Book
          </Typography>
        </Box>
        {/* A number input field for the generation from Material UI */}
        <Box sx={{ display: "flex", flexDirection: "column", m: 1 }}>
          <FamilySelector
            onSelect={selectFamily}
            selectedFamilyGrampsId={famGrampsId}
          />

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
          </Box>

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
          {error !== null && (
            <Alert sx={{ mb: 1 }} severity="error">
              Failed to generate photo book: {String(error)}
            </Alert>
          )}
          <Button
            onClick={() => generate(famGrampsId, generationDown, generationUp)}
            startIcon={<AutoStories />}
            loading={loading}
            variant="contained"
            sx={{ mb: 1 }}
            color={error ? "error" : "primary"}
          >
            Generate Photo Book
          </Button>
          <Button
            onClick={() => window.print()}
            variant="contained"
            startIcon={<Print />}
            disabled={!isLoaded}
          >
            Print
          </Button>
        </Box>
      </Container>

      <div className="photoBook" ref={photoBookRef}>
        {loading && <div>Loading...</div>}

        {isLoaded && <PhotoBook treeData={treeData} title={title} />}
      </div>
    </div>
  );
}

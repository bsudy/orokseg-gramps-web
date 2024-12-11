import { useEffect, useState } from "react";
import { JsonGedcomData } from "topola";
import { familyToTopolaData } from "../../converters/TopolaDataConveter";
import { FamilyTree } from "../FamilyTree";
import { CircularProgress } from "@mui/material";
import { PBFamily, PBPerson } from "../../pages/photoBookModel";

interface FamilyTreePageProps {
  family: PBFamily;
  treeData: { families: PBFamily[]; people: PBPerson[] };
  pageNum: number;
  pageStyle?: React.CSSProperties;
  pages?: Record<string, number>;
}

export const FamilyTreePage = ({
  family,
  treeData,
  pageNum,
  pageStyle,
  pages,
}: FamilyTreePageProps) => {
  const [chartData, setChartData] = useState(null as JsonGedcomData | null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (family) {
      setLoading(true);
      const pagesCopy = { ...pages };
      delete pagesCopy[family.gramps_id];
      familyToTopolaData(family, treeData, pagesCopy).then(
        (data) => {
          setChartData(data);
          setLoading(false);
        },
        (err) => {
          console.error(err);
          setLoading(false);
        },
      );
    }
  }, [family, pages]);

  return (
    <>
      <div
        className={
          `page-left-${family.gramps_id} page ` +
          (pageNum % 2 === 0 ? "leftSide" : "rightSide")
        }
      >
        <div
          className="pageBackground"
          style={{
            ...pageStyle,
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          {loading && <CircularProgress />}
          {chartData && <FamilyTree tree={chartData} />}
          <span className="pageNum">{pageNum}</span>
        </div>
      </div>
    </>
  );
};

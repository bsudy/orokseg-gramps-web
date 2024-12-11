import { useEffect, useState } from "react";
import { CircularProgress } from "@mui/material";
import { MediumPreview } from "../MediumPreview";
import { PBFamily, PBMediumRef } from "../../pages/photoBookModel";

interface PhotosPageProps {
  family: PBFamily;
  pageNum: number;
  pageStyle?: React.CSSProperties;
}

function calculateWidth(imageRations: number[], row: number): number {
  if (imageRations.length < row) {
    throw new Error("Not enough images");
  }

  const runners = new Array(row).fill(0);

  const rowWidth = new Array(row).fill(0);

  imageRations.forEach((imageRation, idx) => {
    if (idx < row) {
      rowWidth[idx] = rowWidth[idx] + imageRation;
      runners[idx] = idx;
    } else {
      rowWidth[row - 1] = rowWidth[row - 1] + imageRation;
    }
  });

  let loop = 100;
  while (loop-- > 0) {
    // determine the longest row
    const [longestWidth, longestRowIdx] = rowWidth.reduce(
      ([prevVal, prevIdx], val, idx) => {
        if (val > prevVal) {
          return [val, idx];
        }
        return [prevVal, prevIdx];
      },
      [0, -1],
    );

    const [, shortestRowIdx] = rowWidth.reduce(
      ([prevVal, prevIdx], val, idx) => {
        if (val < prevVal) {
          return [val, idx];
        }
        return [prevVal, prevIdx];
      },
      [Number.MAX_VALUE, -1],
    );

    // console.log(`Iteration for rows: ${row} longest: ${longestRowIdx}:${longestWidth} shotest:${shortestRowIdx}:${shortestWidth}`);
    // console.log("rowWidth", rowWidth);
    const direction = longestRowIdx < shortestRowIdx ? 1 : -1;
    if (shortestRowIdx === longestRowIdx) {
      return longestWidth;
    }
    for (let idx = longestRowIdx; idx !== shortestRowIdx; idx += direction) {
      const nextIdx = idx + direction;
      //grab the image to be moved
      if (direction === 1) {
        // moving up
        const imgToBeMovedRatio = imageRations[runners[nextIdx] - 1];
        console.log(
          "Moving up",
          imgToBeMovedRatio,
          runners[nextIdx] - 1,
          nextIdx,
          runners,
        );

        rowWidth[idx] = rowWidth[idx] - imgToBeMovedRatio;
        rowWidth[nextIdx] = rowWidth[nextIdx] + imgToBeMovedRatio;

        // update runner position
        runners[nextIdx] = runners[nextIdx] - 1;
      } else {
        // moving down
        const imgToBeMovedRatio = imageRations[runners[idx]];
        console.log(
          "Moving down",
          imgToBeMovedRatio,
          runners[idx],
          idx,
          runners,
        );

        rowWidth[idx] = rowWidth[idx] - imgToBeMovedRatio;
        rowWidth[nextIdx] = rowWidth[nextIdx] + imgToBeMovedRatio;

        // update runner position
        runners[idx] = runners[idx] + 1;
        console.log("rowWidth", rowWidth);
      }
      const currentLongest = Math.max(...rowWidth);

      if (currentLongest < longestWidth) {
        console.log("Found better solution");
        break;
      }
      // if we are here there was not better solution
      console.log("No better solution", longestWidth, currentLongest);
      return longestWidth;
    }
  }
  return 1;
}

function determineRowNumber(imageRations: number[]): number {
  console.log("imageRations", imageRations);
  let rows = 1;
  const previouseWidth = Number.MAX_VALUE;
  while (true) {
    const width = calculateWidth(imageRations, rows);
    console.log(`rows: ${rows} width: ${width}`);
    if (width >= previouseWidth) {
      return rows - 1;
    }
    if (width < rows + 1) {
      return rows;
    }
    rows++;
  }
}

export const PhotosPage = ({ family, pageNum, pageStyle }: PhotosPageProps) => {
  const [loading, setLoading] = useState(true);

  const [imageRations, setImageRations] = useState(
    {} as Record<string, number>,
  );
  const [imageHeight, setImageHeight] = useState(
    undefined as string | undefined,
  );

  const imageOnload = (
    evt: React.SyntheticEvent<HTMLImageElement>,
    gramps_id: string,
  ) => {
    const target = evt.target as HTMLImageElement;
    console.log("Image loaded", gramps_id, target.width, target.height);
    setImageRations((prev) => {
      return {
        ...prev,
        [gramps_id]: target.width / target.height,
      };
    });
  };

  useEffect(() => {
    try {
      if (!family || !family.media_list || family.media_list.length === 0) {
        return;
      }
      for (const mediumRef of family.media_list || []) {
        if (!imageRations[mediumRef.medium.gramps_id]) {
          return;
        }
      }

      const rows = determineRowNumber(
        (family.media_list || []).map(
          (mediumRef: PBMediumRef) => imageRations[mediumRef.medium.gramps_id],
        ),
      );
      setImageHeight(`${100 / rows}%`);
    } finally {
      setLoading(false);
    }
  }, [imageRations, family]);

  return (
    <>
      <div
        className={
          `page-left-${family.gramps_id} page photosPage ` +
          (pageNum % 2 === 0 ? "leftSide" : "rightSide")
        }
      >
        <div className="photosPage-container" style={pageStyle}>
          {(family.media_list || []).map((mediumRef: PBMediumRef) => {
            return (
              <div
                key={mediumRef.medium.gramps_id}
                className="photosPage-page-medium"
                style={{
                  height: imageHeight,
                  padding: "10px",
                  opacity: loading ? 0 : 1,
                }}
              >
                <MediumPreview
                  mediumRef={mediumRef}
                  onLoad={(evt) => imageOnload(evt, mediumRef.medium.gramps_id)}
                />
              </div>
            );
          })}
          {loading && (
            <div className="photosPage-loading">
              <CircularProgress />
              <span>Loading...</span>
            </div>
          )}
          <span className="pageNum">{pageNum}</span>
        </div>
      </div>
    </>
  );
};

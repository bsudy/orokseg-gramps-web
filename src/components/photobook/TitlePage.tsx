import { Typography } from "@mui/material";

interface TitlePageProps {
  text: string;
  pageNum: number;
  pageStyle?: React.CSSProperties;
}

export function TitlePage({ text, pageNum, pageStyle }: TitlePageProps) {
  return (
    <div className={
      `page photosPage ` +
      (pageNum % 2 === 0 ? "leftSide" : "rightSide")
    }>
      <div className="pageBackground" style={{
        ...pageStyle,
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }} >
      <Typography variant="h1" fontFamily="Charm" align="center">
        {text}
      </Typography>
      </div>
    </div>
  );
}

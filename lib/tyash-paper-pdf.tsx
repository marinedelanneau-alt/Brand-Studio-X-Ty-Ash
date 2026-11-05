import { Svg, Line } from "@react-pdf/renderer";
import { TYASH_PAPER_PDF as paper } from "./tyash-paper";

// Page coordinates also apply to pages created by automatic wrapping.
// Half-stroke offset reproduces CSS's full 1 px band at each cell's origin.
export function TyashPaperGrid({ width = 595.28, height = 841.89 }: { width?: number; height?: number }) {
  const offset = paper.strokePt / 2;
  return <Svg fixed width={width} height={height} style={{ position: "absolute", top: 0, left: 0 }}>
    {Array.from({ length: Math.ceil(width / paper.cellPt) }, (_, i) => <Line key={`v${i}`} x1={i * paper.cellPt + offset} y1={0} x2={i * paper.cellPt + offset} y2={height} stroke={paper.line} strokeWidth={paper.strokePt} opacity={paper.opacity} />)}
    {Array.from({ length: Math.ceil(height / paper.cellPt) }, (_, i) => <Line key={`h${i}`} x1={0} y1={i * paper.cellPt + offset} x2={width} y2={i * paper.cellPt + offset} stroke={paper.line} strokeWidth={paper.strokePt} opacity={paper.opacity} />)}
  </Svg>;
}

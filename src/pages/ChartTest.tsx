import { useEffect, useId, useRef } from "react";
import * as d3 from "d3";
import { ThirtyFpsSharp, Widgets } from "@mui/icons-material";
import testData from "./testData";
import * as topola from "topola";
import { FanChart as TFanChart } from "../components/charts/FanChart";
import "./fanChart.css";

type FanChartNode = {
  family: topola.JsonFam | undefined;
  father: topola.JsonIndi | undefined;
  mother: topola.JsonIndi | undefined;
};
type FanChartLevel = Array<FanChartNode>;
type FanChartDescententLevel = Array<{
  person: topola.JsonIndi | undefined;
  families: Array<{ family: topola.JsonFam | undefined; ratio: number }>;
  ratio: number;
}>;
type FanChartData = {
  up: Array<FanChartLevel>;
  down: Array<FanChartDescententLevel>;
};

type FanChartOptions = {
  nameRenderer: (person: topola.JsonIndi) => {
    text: string | undefined;
    subText: string | undefined;
  };
  familyRenderer: (family: topola.JsonFam) => string | undefined;
  cornerRadius: number;
};

class FanChart {
  private svg: d3.Selection<SVGGElement, unknown, null, undefined>;
  private width: number;
  // private height: number;
  private num_of_levels: number;

  private full_arc = Math.PI * 0.98;
  private center_radius = 1;
  private padding = 2; // Padding between arcs

  private simpleArcHeight;
  private familyArcHeight;
  private highArcHeight;
  private highArcMinLevel;
  private options: FanChartOptions;

  private data: FanChartData;

  constructor(
    svg: d3.Selection<SVGGElement, unknown, null, undefined>,
    width: number,
    data: FanChartData,
    options: Partial<FanChartOptions> = {},
  ) {
    this.options = {
      nameRenderer: (person: topola.JsonIndi) => ({
        text: `${person.firstName}, ${person.lastName}`,
        subText: `${person.birth?.date?.year || ""} - ${person.death?.date?.year || ""}`,
      }),
      familyRenderer: (family: topola.JsonFam) => family.id,
      cornerRadius: 2,
      ...options,
    };

    this.svg = svg;
    this.width = width;
    // this.height = this.width / (2 * (num_of_levels + this.center_radius));
    const simpleArcHeightWeight = 1;
    const familyArcHeightWeight = 0.25;
    const highArcHeightWeight = 2;
    const highArcMinLevel = 3;

    const num_of_levels = data.up.length;
    this.data = data;
    const divider =
      (simpleArcHeightWeight + familyArcHeightWeight + 2 * this.padding) *
        Math.min(num_of_levels, highArcMinLevel) *
        simpleArcHeightWeight +
      (highArcHeightWeight + familyArcHeightWeight + this.padding) *
        Math.max(0, num_of_levels - highArcMinLevel) +
      0.5;

    this.simpleArcHeight = (this.width / divider) * simpleArcHeightWeight;
    this.familyArcHeight = (this.width / divider) * familyArcHeightWeight;
    this.highArcHeight = (this.width / divider) * highArcHeightWeight;
    this.highArcMinLevel = highArcMinLevel;
    this.num_of_levels = num_of_levels;
  }

  private adjustFontSize(
    textElement:
      | d3.Selection<SVGTextElement, unknown, null, undefined>
      | d3.Selection<SVGTextPathElement, unknown, null, undefined>,
    defaultFontSize: number,
    maxTextLength: number,
    maxTextHeight: number | undefined = undefined,
  ) {
    let textLength = textElement.node()?.getComputedTextLength();
    if (textLength === undefined) {
      return;
    }
    let textFontSize = Math.min(
      defaultFontSize,
      (maxTextLength / textLength) * 16,
    ); // Adjust the base font size as needed
    textElement.style("font-size", `${textFontSize}px`);

    while (true) {
      //@ts-ignore
      const textLength = textElement.node().getComputedTextLength();
      if (textLength > maxTextLength) {
        textFontSize *= 0.9;
        textElement.style("font-size", `${textFontSize}px`);
      } else {
        break;
      }
    }
    if (maxTextHeight !== undefined) {
      if (textFontSize > maxTextHeight * 0.9) {
        textElement.style("font-size", `${maxTextHeight * 0.5}px`);
      }
    }
  }

  private addText(
    arc: d3.Arc<any, d3.DefaultArcObject>,
    placement: number,
    maxFontSize: number,
    text: string,
    textPathId: string,
    direction: "radial" | "circumferential" = "circumferential",
  ) {
    //@ts-ignore
    const innnerRadius: number = arc.innerRadius()();
    //@ts-ignore
    const outerRadius: number = arc.outerRadius()();
    //@ts-ignore
    const startAngle: number = arc.startAngle()();
    //@ts-ignore
    const endAngle: number = arc.endAngle()();

    if (direction === "radial") {
      const radialTextPathId = textPathId;

      const radialTextArcAngle =
        startAngle + (endAngle - startAngle) * placement;
      const radialTextArc = d3
        .arc()
        .innerRadius(innnerRadius)
        .outerRadius(outerRadius)
        .startAngle(radialTextArcAngle)
        .endAngle(radialTextArcAngle);

      this.svg
        .append("path")
        .attr("id", radialTextPathId)
        .attr("d", radialTextArc as unknown as string)
        .attr("fill", "none");

      //@ts-ignore
      const textElement = this.svg
        .append("text")
        .append("textPath")
        .attr("xlink:href", `#${radialTextPathId}`)
        .attr("startOffset", "25%") // Center the text along the path
        .attr("text-anchor", "middle")
        .text(text);

      const maxTextLength = (outerRadius - innnerRadius) * 0.9;
      this.adjustFontSize(textElement, maxFontSize, maxTextLength);

      return textElement;
    } else {
      const textRadius =
        innnerRadius + (outerRadius - innnerRadius) * placement;
      const textArc = d3
        .arc()
        .innerRadius(textRadius)
        .outerRadius(textRadius)
        .startAngle(startAngle)
        .endAngle(endAngle);

      this.svg
        .append("path")
        .attr("id", textPathId)
        .attr("d", textArc as unknown as string)
        .attr("fill", "none");

      // @ts-ignore
      const maxTextLength =
        this.svg.select(`#${textPathId}`).node().getTotalLength() * 0.45;

      const textElement = this.svg
        .append("text")
        .append("textPath")
        .attr("xlink:href", `#${textPathId}`)
        .attr("startOffset", "25%") // Center the text along the path
        .attr("text-anchor", "middle")
        .text(text);

      this.adjustFontSize(textElement, maxFontSize, maxTextLength);
      return textElement;
    }
  }

  private addFamilyArc(
    level: number,
    i: number,
    text: string | undefined = undefined,
  ) {
    const num_of_families = 2 ** level;

    const startAngle =
      (this.full_arc / num_of_families) * i - this.full_arc / 2;
    const endAngle =
      (this.full_arc / num_of_families) * (i + 1) - this.full_arc / 2;

    const innerRadius =
      (this.simpleArcHeight + this.familyArcHeight + this.padding) *
        Math.min(level, this.highArcMinLevel) +
      this.simpleArcHeight * 0.5 +
      this.padding +
      Math.max(0, level - this.highArcMinLevel) *
        (this.highArcHeight + this.familyArcHeight + this.padding);
    const outerRadius = innerRadius + this.familyArcHeight;

    const arc = d3
      .arc()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius)
      .startAngle(startAngle)
      .endAngle(endAngle)
      .cornerRadius(this.options.cornerRadius); // Add corner radius

    const pathId = `family_arc_path_${level}-${i}`;

    this.svg
      .append("path")
      .attr("id", pathId)
      .attr("d", arc as unknown as string)
      .attr("fill", "none")
      .attr("stroke", i % 2 === 0 ? "green" : "pink")
      .attr("stroke-width", 2); // Add border width

    if (text !== undefined) {
      const textPathId = `family_text_path_${level}-${i}`;
      const textArcRadius = innerRadius + (outerRadius - innerRadius) * 0.65;
      const textArc = d3
        .arc()
        .innerRadius(textArcRadius)
        .outerRadius(textArcRadius)
        .startAngle(startAngle)
        .endAngle(endAngle);

      this.svg
        .append("path")
        .attr("id", textPathId)
        .attr("d", textArc as unknown as string)
        // .attr("stroke", "black")
        // .attr("stroke-width", 1) // Add border width
        .attr("fill", "none");

      // @ts-ignore
      const maxTextLength =
        this.svg.select(`#${textPathId}`).node().getTotalLength() * 0.45;

      // @ts-ignore
      const textElement = this.svg
        .append("text")
        .attr("dy", "0.35em")
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "center")
        .append("textPath")
        .attr("xlink:href", `#${textPathId}`)
        .attr("href", `#${textPathId}`)
        .attr("startOffset", "25%")
        .text(text);

      this.adjustFontSize(
        textElement,
        this.familyArcHeight * 0.7,
        maxTextLength,
      );
    }
  }

  private addPersonArc(
    level: number,
    i: number,
    text1: string | undefined,
    text2: string | undefined = undefined,
  ) {
    const num_of_people = 2 ** (level + 1);

    const startAngle = (this.full_arc / num_of_people) * i - this.full_arc / 2;
    const endAngle =
      (this.full_arc / num_of_people) * (i + 1) - this.full_arc / 2;

    const innerRadius =
      (this.simpleArcHeight + this.familyArcHeight + this.padding) *
        Math.min(level, this.highArcMinLevel) +
      (this.highArcHeight + this.familyArcHeight + this.padding) *
        Math.max(0, level - this.highArcMinLevel) +
      this.simpleArcHeight * 0.5 +
      this.familyArcHeight +
      this.padding;
    // console.log(level, this.highArcMinLevel, innerRadius, this.simpleArcHeight, this.familyArcHeight, this.highArcHeight);

    // const innnerRadius = this.height * level + (this.height / 2) * this.center_radius + this.padding;
    const outerRadius =
      innerRadius +
      (level < this.highArcMinLevel
        ? this.simpleArcHeight
        : this.highArcHeight);

    const arcG = d3
      .arc()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius)
      .startAngle(startAngle)
      .endAngle(endAngle)
      .cornerRadius(this.options.cornerRadius); // Add corner radius

    const pathId = `arcPath${level}-${i}`;

    this.svg
      .append("path")
      .attr("id", pathId)
      .attr("d", arcG as unknown as string)
      .attr(
        "class",
        `personArc personArcLevel${level} personArcIdx${i} personArcInCoupleIdx${i % 2}`,
      );

    // TODO generate better id
    if (text1 !== undefined) {
      const textDirection =
        level < this.highArcMinLevel ? "circumferential" : "radial";
      const text1El = this.addText(
        arcG,
        0.6,
        16,
        text1,
        `person-text1-${level}-${i}`,
        textDirection,
      );
      const text1FontSize = Number.parseInt(
        text1El.style("font-size").replace("px", ""),
      );
      if (text2 !== undefined) {
        this.addText(
          arcG,
          0.3,
          text1FontSize * 0.8,
          text2,
          `person-text2-${level}-${i}`,
          textDirection,
        );
      }
    }
  }

  public addDescendentArc(
    level: number,
    sectionsOfLevel: number,
    startSection: number,
    size: number,
    highArcMinLevel: number | undefined,
    text: string | undefined = undefined,
  ) {
    const startAngle =
      (this.full_arc / sectionsOfLevel) * startSection -
      this.full_arc / 2 +
      Math.PI;
    const endAngle =
      (this.full_arc / sectionsOfLevel) * (startSection + size) -
      this.full_arc / 2 +
      Math.PI;

    const innerRadius =
      (this.simpleArcHeight + this.familyArcHeight + this.padding) *
        (highArcMinLevel !== undefined
          ? Math.min(level, highArcMinLevel)
          : level) +
      this.simpleArcHeight * 0.5 +
      this.familyArcHeight +
      this.padding +
      (highArcMinLevel !== undefined
        ? (this.highArcHeight + this.familyArcHeight + this.padding) *
          Math.max(0, level - highArcMinLevel)
        : 0);

    const outerRadius =
      innerRadius +
      (highArcMinLevel === undefined || level < highArcMinLevel
        ? this.simpleArcHeight
        : this.highArcHeight);

    const arcG = d3
      .arc()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius)
      .startAngle(startAngle)
      .endAngle(endAngle)
      .cornerRadius(this.options.cornerRadius); // Add corner radius

    const pathId = `arcPath${level}-${startSection}-${size}`;

    this.svg
      .append("path")
      .attr("id", pathId)
      .attr("d", arcG as unknown as string)
      .attr(
        "class",
        `personArc descendantPersonArc descendantArcLevel${level}`,
      );

    // TODO generate better id
    if (text !== undefined) {
      const textDirection = highArcMinLevel ? "circumferential" : "radial";
      const text1El = this.addText(
        arcG,
        0.6,
        16,
        text,
        `descendant-text1-${level}-${startSection}`,
        textDirection,
      );
    }
  }

  public render() {
    this.svg.selectAll("*").remove();

    for (let l = 0; l < this.num_of_levels; l++) {
      for (let familyIdx = 0; familyIdx < 2 ** l; familyIdx++) {
        const node = this.data.up[l][familyIdx];

        if (node !== undefined && node.family !== undefined) {
          this.addFamilyArc(
            l,
            familyIdx,
            this.options.familyRenderer(node.family),
          );
          if (node?.father !== undefined) {
            const fatherName = this.options.nameRenderer(node.father);
            this.addPersonArc(
              l,
              familyIdx * 2,
              fatherName.text,
              fatherName.subText,
            );
          }
          if (node?.mother !== undefined) {
            const motherName = this.options.nameRenderer(node.mother);
            this.addPersonArc(
              l,
              familyIdx * 2 + 1,
              motherName.text,
              motherName.subText,
            );
          }
        }
      }
    }

    let highArcMinLevel = undefined;
    for (let l = 0; l < this.num_of_levels; l++) {
      const num_of_sections = this.data.down[l].reduce(
        (acc, person) => acc + person.ratio,
        0,
      );
      if (highArcMinLevel === undefined) {
        const min_ratio = Math.min(
          ...this.data.down[l].map((person) => person.ratio / num_of_sections),
        );
        if (min_ratio < 1 / 8) {
          highArcMinLevel = l;
        }
      }

      let current_section = 0;
      for (let person of this.data.down[l]) {
        if (person.person !== undefined) {
          this.addDescendentArc(
            l,
            num_of_sections,
            current_section,
            person.ratio,
            highArcMinLevel,
            this.options.nameRenderer(person.person).text,
          );
        }
        current_section += person.ratio;
      }
    }
  }
}

const data = testData as topola.JsonGedcomData;

function toFamilyTreeAncestors(
  data: {
    indiMap: Map<string, topola.JsonIndi>;
    famMap: Map<String, topola.JsonFam>;
  },
  famId: string | undefined,
  maxLevels: number,
): Array<FanChartLevel> {
  const family = famId !== undefined ? data.famMap.get(famId) : undefined;
  const father = family?.husb ? data.indiMap.get(family.husb) : undefined;
  const mother = family?.wife ? data.indiMap.get(family.wife) : undefined;

  const thisLevel = { family, father, mother, ratio: 1 } as FanChartNode;

  if (maxLevels > 0) {
    const fatherSubTree = toFamilyTreeAncestors(
      data,
      father?.famc,
      maxLevels - 1,
    );
    const motherSubTree = toFamilyTreeAncestors(
      data,
      mother?.famc,
      maxLevels - 1,
    );

    const subTree = fatherSubTree.map((f, i) => {
      return [...f, ...motherSubTree[i]];
    });

    return [[thisLevel], ...subTree];
  }
  return [[thisLevel]];
}

function toFamilyTreeDescendants(
  data: {
    indiMap: Map<string, topola.JsonIndi>;
    famMap: Map<String, topola.JsonFam>;
  },
  famId: string | undefined,
  maxLevels: number,
): Array<FanChartDescententLevel> {
  console.log("toFamilyTreeDescendants", famId, maxLevels);
  if (maxLevels === 0) {
    return [[{ person: undefined, families: [], ratio: 1 }]];
  }

  const family = famId !== undefined ? data.famMap.get(famId) : undefined;

  console.log(`${famId}:${maxLevels} family`, family?.children);
  const children = (family?.children?.length ? family.children : [undefined])
    .map((childId) =>
      childId !== undefined ? data.indiMap.get(childId) : undefined,
    )
    .map((child) => {
      if (child === undefined) {
        return {
          person: undefined,
          families: [undefined],
          subLevelPerFamily: [
            toFamilyTreeDescendants(data, undefined, maxLevels - 1),
          ],
          ratio: 1,
        };
      }
      const families = child?.fams
        ?.map((famId) => data.famMap.get(famId))
        .filter((f) => f !== undefined) as Array<topola.JsonFam>;

      const subLevelPerFamily = (
        child?.fams?.length ? child.fams : [undefined]
      ).map((famId) => {
        return toFamilyTreeDescendants(data, famId, maxLevels - 1);
      });

      const ratio = subLevelPerFamily.reduce(
        (acc, subLevels) =>
          acc + subLevels[0].reduce((acc, subLevel) => acc + subLevel.ratio, 0),
        0,
      );

      return { person: child, families, subLevelPerFamily, ratio };
    });

  console.log(`${famId}:${maxLevels} children`, children);

  const thisLevel = [] as FanChartDescententLevel;
  const subLevelsAccumulator = [] as Array<FanChartDescententLevel>;

  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    const childSubLevels = child.subLevelPerFamily.map((f) => f[0]);
    for (let subLevels of child.subLevelPerFamily) {
      for (let j = 0; j < subLevels.length; j++) {
        subLevelsAccumulator[j] = [
          ...(subLevelsAccumulator[j] || []),
          ...subLevels[j],
        ];
      }
    }

    // person: families: { family: Array<topola.JsonFam>, ratio: number }, ratio: number
    thisLevel.push({
      person: child.person,
      families: child.families.map((family, i) => ({
        family,
        ratio: childSubLevels[i].reduce(
          (acc, subLevel) => acc + subLevel.ratio,
          0,
        ),
      })),
      ratio: child.ratio,
    });
  }

  console.log(`${famId}:${maxLevels} thisLevel`, thisLevel);

  return [thisLevel, ...subLevelsAccumulator];
}

function toFamilyTreeData(
  data: topola.JsonGedcomData,
  famId: string | undefined,
  maxLevels: number,
): FanChartData {
  const indiMap = new Map<string, topola.JsonIndi>();
  const famMap = new Map<string, topola.JsonFam>();
  data.indis.forEach((indi) => indiMap.set(indi.id, indi));
  data.fams.forEach((fam) => famMap.set(fam.id, fam));
  return {
    up: toFamilyTreeAncestors({ indiMap, famMap }, famId, maxLevels),
    down: toFamilyTreeDescendants({ indiMap, famMap }, famId, maxLevels),
  };
}

export function ChartTest() {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const familyTreeData = toFamilyTreeData(data, "F3047", 4);

  useEffect(() => {
    const width = 1000;
    const num_of_levels = 4;
    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", width)
      .append("g")
      .attr("transform", `translate(${width / 2}, ${width / 2})`);

    // const famId = 'F3047';
    const famId = "F4126";
    const fanChart = new FanChart(
      svg,
      width,
      //toFamilyTreeData(data, famId, num_of_levels),
      familyTreeData,
    );
    fanChart.render();
  }, []);

  // useEffect(() => {
  //   topola.createChart({
  //     json: data,
  //     indiUrl: 'http://kielakowie.pl/tng/getperson.php?tree=tree381&personID=${id}',
  //     famUrl: 'http://kielakowie.pl/tng/familygroup.php?tree=tree381&familyID=${id}',
  //     svgSelector: '#chartTestSvg',
  //     chartType: TFanChart,
  //     renderer: topola.DetailedRenderer,
  //   }).render({
  //     startFam: 'F3047',
  //   });
  // }, []);

  return (
    <div id="chartTest">
      <h1>Hello World!</h1>
      <svg ref={svgRef} id="chartTestSvg"></svg>
    </div>
  );
}

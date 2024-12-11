import { useEffect, useRef } from "react";
import * as topola from "topola";

import { generateQuerySelectorFor } from "../utils/dom";
import { displayFirstname, displaySurname } from "../utils/name";
import { Maybe } from "graphql/jsutils/Maybe";
import { max } from "d3-array";
import { select } from "d3-selection";
import {
  gedcomEntriesToJson,
  JsonFam,
  JsonGedcomData,
  JsonImage,
  JsonIndi,
} from "topola";
import { useNavigate } from "react-router-dom";
import { getCutout } from "../utils/medium";
import {
  PBFamily,
  PBMediumRef,
  PBPerson,
  PBTreeData,
} from "../pages/photoBookModel";
import { tree } from "d3-hierarchy";
// import {
//   D3ZoomEvent,
//   zoom,
//   ZoomBehavior,
//   ZoomedElementBaseType,
//   zoomTransform,
// } from 'd3-zoom';

const data = {
  indis: [
    {
      id: "I1",
      firstName: "John",
      lastName: "Smith",
      famc: "F1",
    },
    {
      id: "I2",
      firstName: "Peter",
      lastName: "Smith",
      fams: ["F1"],
    },
    {
      id: "I3",
      firstName: "Laura",
      lastName: "Abbot",
      fams: ["F1"],
      sex: "F",
      birth: {
        date: {
          day: 31,
          month: 5,
          year: 1443,
        },
        place: "Bletsoe",
      },
      death: {
        confirmed: true,
        date: {
          day: 29,
          month: 6,
          year: 1509,
        },
      },
    },
  ],
  fams: [
    {
      id: "F1",
      husb: "I2",
      wife: "I3",
      children: ["I1"],
      marriage: {
        date: {
          day: 1,
          month: 5,
          year: 1464,
        },
        place: "Grafton Regis, Northamptonshire",
      },
    },
  ],
};

interface PersonTreeProps {
  person: PBPerson;
  treeData: PBTreeData;
}

async function toImg(mediumRef: PBMediumRef): Promise<JsonImage> {
  return {
    url: await getCutout(mediumRef),
    title: mediumRef.medium.desc || "",
  };
}

async function toTopolaIndi(person: PBPerson): Promise<JsonIndi> {
  const images = [];
  if (
    person.media_list &&
    person.media_list.length > 0 &&
    person.media_list[0]
  ) {
    images.push(await toImg(person.media_list[0]));
  }
  return {
    id: person.gramps_id,
    firstName: displayFirstname(person.primary_name),
    lastName: displaySurname(person.primary_name),
    // famc: null,
    fams: [],
    images,
  };
}

async function toTopolaData(
  person: PBPerson,
  treeData: { families: PBFamily[]; people: PBPerson[] },
): Promise<JsonGedcomData> {
  const indis = {} as Record<string, JsonIndi>;
  const fams = {} as Record<string, JsonFam>;

  async function processPerson(person?: PBPerson | Maybe<PBPerson>) {
    if (!person) {
      return;
    }
    if (!Object.keys(indis).includes(person.gramps_id)) {
      indis[person.gramps_id] = await toTopolaIndi(person);
    }
  }

  async function processParentFamily(person?: PBPerson | Maybe<PBPerson>) {
    if (!person) {
      return;
    }

    return await Promise.all(
      (person.parent_family_list || [])
        .map((fam_ref) =>
          treeData.families.find((fam) => fam.handle === fam_ref),
        )
        .filter((family) => family !== undefined)
        // @ts-ignore
        .map(async (family: PBFamily) => {
          if (!Object.keys(fams).includes(family.gramps_id)) {
            fams[family.gramps_id] = {
              id: family.gramps_id,
              husb: treeData.people.find(
                (p) => p.handle === family.father_handle,
              )?.gramps_id,
              wife: treeData.people.find(
                (p) => p.handle === family.mother_handle,
              )?.gramps_id,
              children: family.child_ref_list
                .map((child) =>
                  treeData.people.find((p) => p.handle === child.ref),
                )
                .filter((child) => child !== undefined)
                ?.map((child) => child?.gramps_id)
                .filter((id) => id !== undefined) as string[] | undefined,
            };
            await Promise.all(
              [family.father_handle, family.mother_handle].map(
                async (handle) => {
                  const parent = treeData.people.find(
                    (p) => p.handle === handle,
                  );
                  if (parent) {
                    await processPerson(parent);
                  }
                },
              ),
            );
          }
          indis[person.gramps_id].famc = family.gramps_id;
        }),
    );
  }

  await processPerson(person);
  await Promise.all(
    (person.family_list || [])
      .map((familyRef) =>
        treeData.families.find((fam) => fam.handle === familyRef),
      )
      .filter((family) => family !== undefined)
      // @ts-ignore
      .map(async (family: PBFamily) => {
        if (!Object.keys(fams).includes(family.gramps_id)) {
          fams[family.gramps_id] = {
            id: family.gramps_id,
            husb: treeData.people.find((p) => p.handle === family.father_handle)
              ?.gramps_id,
            wife: treeData.people.find((p) => p.handle === family.mother_handle)
              ?.gramps_id,
            children: family.child_ref_list
              .map((child) =>
                treeData.people.find((p) => p.handle === child.ref),
              )
              .filter((child) => child !== undefined)
              ?.map((child) => child?.gramps_id)
              .filter((id) => id !== undefined) as string[] | undefined,
          };
          await Promise.all(
            [family.father_handle, family.mother_handle].map(async (handle) => {
              const parent = treeData.people.find((p) => p.handle === handle);
              if (parent) {
                await processPerson(parent);
                await processParentFamily(parent);
              }
            }),
          );
        }

        await Promise.all(
          (family.child_ref_list || [])
            .map((childRef) =>
              treeData.people.find((p) => p.handle === childRef.ref),
            )
            .filter((child) => child !== undefined)
            // @ts-ignore
            .map(async (child: PBPerson) => {
              if (child && !Object.keys(indis).includes(child?.gramps_id)) {
                await processPerson(child);
              }
              indis[child.gramps_id].famc = family.gramps_id;
            }),
        );
        // TODO what if not single parents? Shall we take the first one.
        indis[person.gramps_id].fams?.push(family.gramps_id);
      }),
  );

  await processParentFamily(person);

  // await Promise.all(
  //   (person.parentFamilies || []).map(async (family) => {
  //     if (!Object.keys(fams).includes(family.gramps_id)) {
  //       fams[family.gramps_id] = {
  //         id: family.gramps_id,
  //         husb: family.father?.gramps_id,
  //         wife: family.mother?.gramps_id,
  //         children: family.children
  //           ?.map((child) => child.person?.gramps_id)
  //           .filter((id) => id !== undefined) as string[] | undefined,
  //       };
  //       await processPerson(family.father);
  //       await processPerson(family.mother);
  //     }
  //     indis[person.gramps_id].famc = family.gramps_id;
  //   }),
  // );

  const topolaData = {
    indis: Object.values(indis),
    fams: Object.values(fams),
  };

  console.log(topolaData);

  return topolaData;
}

export const PersonTree = ({ person, treeData }: PersonTreeProps) => {
  const navigate = useNavigate();

  const chartRef = useRef<topola.ChartHandle | null>(null);
  const svgRef = useRef<SVGGElement>(null);
  console.log("PersonTree component for", person.gramps_id);

  async function renderChart() {
    console.log("PersonTree inital render for", person.gramps_id);
    if (!svgRef.current) {
      console.error("svgRef is not set");
      return;
    }

    const selector = generateQuerySelectorFor(svgRef.current);

    if (!chartRef.current) {
      const chart = topola.createChart({
        json: await toTopolaData(person, treeData),
        chartType: topola.HourglassChart,
        renderer: topola.DetailedRenderer,
        animate: true,
        updateSvgSize: false,
        svgSelector: selector,
        // indiUrl: '/people/tree/${id}',
        indiCallback: (info) => {
          console.log("indiCallback", info);
          navigate(`/people/tree/${info.id}`);
        },
      });
      chartRef.current = chart;
    } else {
      chartRef.current.setData(await toTopolaData(person, treeData));
    }

    const chartInfo = chartRef.current.render();

    const svg = svgRef.current;
    const svgParent = svg.parentElement! as Element as SVGElement;
    const parent = svgParent.parentElement! as Element as HTMLDivElement;
    const area = parent.getBoundingClientRect();
    console.log("area", area);

    const scale = 1.4;
    const dx = parent.clientWidth / 2 - chartInfo.origin[0] * scale;
    const dy = parent.clientHeight / 2 - chartInfo.origin[1] * scale;
    const offsetX =
      max([0, (parent.clientWidth - chartInfo.size[0] * scale) / 2]) || 0;
    const offsetY =
      max([0, (parent.clientHeight - chartInfo.size[1] * scale) / 2]) || 0;

    // console.log('constiner.Height', parent.clientHeight);
    // console.log('svgParent.height', svgParent.clientHeight);
    // console.log('svg.height', svg.clientHeight);
    // console.log('chartInfo.height', chartInfo.size[1]);
    // console.log('chartInfo.height (after scaling)', chartInfo.size[1] * scale);
    // console.log('difference', (parent.clientHeight - chartInfo.size[1] * scale));
    // console.log('offsetY', offsetY);

    // console.log('constiner.width', parent.clientWidth);
    // console.log('svgParent.width', svgParent.clientWidth);
    // console.log('svg.width', svg.clientWidth);
    // console.log('chartInfo.width', chartInfo.size[1]);
    // console.log('chartInfo.width (after scaling)', chartInfo.size[0] * scale);
    // console.log('difference', (parent.clientWidth - chartInfo.size[0] * scale));
    // console.log('offsetX', offsetX);

    svgParent.style.setProperty("transform-delay", "200ms");
    svgParent.style.setProperty("transform-duration", "500ms");
    svgParent.style.setProperty("width", chartInfo.size[0] + "px");
    svgParent.style.setProperty("height", chartInfo.size[1] + "px");
    svgParent.style.setProperty("scale", `${scale}`);
    console.log("transform", `translate(${offsetX}px, ${offsetY}px)`);
    svgParent.style.setProperty(
      "transform",
      `translate(${offsetX / scale}px, ${offsetY / scale}px)`,
    );
  }

  useEffect(() => {
    console.log("PersonTree render for", person.gramps_id);
    renderChart();
  }, [person]);

  // useEffect(() => {
  //   console.log('PersonTree initial render for', person.gramps_id);
  //   renderChart();
  // }, []);

  return (
    <div id={`PersontTree-${person.gramps_id}`}>
      <h1>Person Tree</h1>
      <div
        className="chartContainer"
        style={{ width: "90%", margin: "0 auto", display: "block" }}
      >
        <svg className="chartSvg">
          <g className="chart" ref={svgRef} />
        </svg>
      </div>
    </div>
  );
};

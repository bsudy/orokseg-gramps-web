import {
  JsonEvent,
  JsonFam,
  JsonGedcomData,
  JsonImage,
  JsonIndi,
} from "topola";
import { AttributeType, Family, Person } from "../api/model";
import { getCutout } from "../utils/medium";
import { displayFirstname, displaySurname } from "../utils/name";
import { Maybe } from "graphql/jsutils/Maybe";
import {
  OroksegJsonGedcomData,
  OroksegJsonFam,
  OroksegJsonIndi,
} from "../components/charts/OroksegChart";
import { PBFamily, PBMediumRef, PBPerson } from "../pages/photoBookModel";

class TopolaConverter {
  private indis = {} as Record<string, JsonIndi>;
  private fams = {} as Record<string, JsonFam>;

  constructor(
    readonly treeData: { families: PBFamily[]; people: PBPerson[] },
    readonly pages?: Record<string, number>,
  ) {}

  private registerFamily(
    family: PBFamily,
    down: number,
  ): OroksegJsonFam | undefined {
    if (!Object.keys(this.fams).includes(family.gramps_id)) {
      const children =
        down === 0
          ? []
          : (family.child_ref_list
              .map((child) =>
                this.treeData.people.find((p) => p.handle === child.ref),
              )
              ?.map((child) => child?.gramps_id)
              .filter((id) => id !== undefined) as string[] | undefined);

      const jsonFam = {
        id: family.gramps_id,
        husb: this.treeData.people.find(
          (p) => p.handle === family.father_handle,
        )?.gramps_id,
        wife: this.treeData.people.find(
          (p) => p.handle === family.mother_handle,
        )?.gramps_id,
        children,
        // marriage: {
        //   type: "MARR",
        //   date: {
        //     year: 1900,
        //   },
        //   place: "Székesfehérvár",
        // },
        page: this.pages?.[family.gramps_id],
      } as OroksegJsonFam;
      this.fams[family.gramps_id] = jsonFam;
      return jsonFam;
    }
  }

  private async toImg(mediumRef: PBMediumRef): Promise<JsonImage> {
    return {
      url: await getCutout(mediumRef),
      title: mediumRef.medium.desc || "",
    };
  }

  private async toTopolaIndi(person: PBPerson): Promise<OroksegJsonIndi> {
    const images = [];
    if (
      person.media_list &&
      person.media_list.length > 0 &&
      person.media_list[0]
    ) {
      images.push(await this.toImg(person.media_list[0]));
    }

    const occupation =
      person.attribute_list?.find((attr) => attr.type.string === "Occupationa")
        ?.value || undefined;
    const denomination =
      person.attribute_list?.find((attr) => attr.type.string === "Denomination")
        ?.value || undefined;

    let birth = undefined;
    if (person.birthEvent?.date?.dateval) {
      console.log("Birth date", person.birthEvent.date);
      const [day, month, year] = person.birthEvent.date.dateval;
      birth = {
        date: {
          day: day || undefined,
          month: month || undefined,
          year: year || undefined,
        },
        // handle enddate (in that case is should be a range)
        type: "BIRT",
      } as JsonEvent;
    }

    let death = undefined;
    if (person.deathEvent?.date?.dateval) {
      const [day, month, year] = person.deathEvent.date.dateval;

      death = {
        date: {
          day: day || undefined,
          month: month || undefined,
          year: year || undefined,
        },
        // handle enddate (in that case is should be a range)
        type: "DEAT",
      } as JsonEvent;
    }

    return {
      id: person.gramps_id,
      firstName: displayFirstname(person.primary_name),
      lastName: displaySurname(person.primary_name),
      // famc: null,
      fams: [],
      images,
      occupation,
      denomination,
      birth,
      death,
    };
  }

  private async processPerson(person?: PBPerson | Maybe<PBPerson>) {
    if (!person) {
      return;
    }
    if (!Object.keys(this.indis).includes(person.gramps_id)) {
      this.indis[person.gramps_id] = await this.toTopolaIndi(person);
    }
  }

  private async processParentFamily(person?: PBPerson | Maybe<PBPerson>) {
    if (!person) {
      return;
    }
    return await Promise.all(
      (person.parent_family_list || [])
        .map((family_ref) =>
          this.treeData.families.find((f) => f.handle === family_ref),
        )
        .filter((family) => family !== undefined)
        .map(async (family) => {
          const fam = this.registerFamily(family, 0);
          await Promise.all(
            [family?.father_handle, family?.mother_handle]
              .map((parent) =>
                this.treeData.people.find((p) => p.handle === parent),
              )
              .filter((parent) => parent !== undefined)
              .map(async (parent) => await this.processPerson(parent)),
          );
          this.indis[person.gramps_id].famc = family.gramps_id;
        }),
    );
  }

  async addPerson(person: PBPerson) {
    await this.processPerson(person);
    await Promise.all(
      (person.family_list || [])
        .map((familyRef) =>
          this.treeData.families.find((fam) => fam.handle === familyRef),
        )
        .filter((family) => family !== undefined)
        .map(async (family) => {
          this.addFamily(family);
          // TODO what if not single parents? Shall we take the first one.
          this.indis[person.gramps_id].fams?.push(family.gramps_id);
        }),
    );

    await this.processParentFamily(person);
  }

  async addFamily(family: PBFamily, down: number = 1) {
    // console.log("Add family", family);
    const fam = this.registerFamily(family, down);
    if (fam) {
      if (family.father_handle) {
        const father = this.treeData.people.find(
          (p) => p.handle === family.father_handle,
        );
        if (father) {
          await this.processPerson(father);
          this.indis[father.gramps_id].fams?.push(family.gramps_id);
          await this.processParentFamily(father);
        }
      }
      if (family.mother_handle) {
        const mother = this.treeData.people.find(
          (p) => p.handle === family.mother_handle,
        );
        if (mother) {
          await this.processPerson(mother);
          this.indis[mother.gramps_id].fams?.push(family.gramps_id);
          await this.processParentFamily(mother);
        }
      }
    }
    if (down > 0) {
      await Promise.all(
        (family.child_ref_list || [])
          .map((childRef) =>
            this.treeData.people.find((p) => p.handle === childRef.ref),
          )
          .filter((child) => child !== undefined)
          .map(async (child) => {
            // console.log("Add child", displayName(child.person?.name));
            if (child && !Object.keys(this.indis).includes(child.gramps_id)) {
              await this.processPerson(child);
              // spouses of children
              await Promise.all(
                (child.family_list || [])
                  .map((familyRef) =>
                    this.treeData.families.find(
                      (fam) => fam.handle === familyRef,
                    ),
                  )
                  .filter((family) => family !== undefined)
                  .map(async (family) => {
                    await this.addFamily(family, down - 1);
                  }),
              );
            }
            this.indis[child.gramps_id].famc = family.gramps_id;
          }),
      );
    }
  }

  getTopolaData(): JsonGedcomData {
    return {
      indis: Object.values(this.indis),
      fams: Object.values(this.fams),
    };
  }
}

export async function familyToTopolaData(
  family: PBFamily,
  treeData: { families: PBFamily[]; people: PBPerson[] },
  pages?: Record<string, number>,
): Promise<OroksegJsonGedcomData> {
  const converter = new TopolaConverter(treeData, pages);
  await converter.addFamily(family);
  return converter.getTopolaData();
}

export async function personToTopolaData(
  person: PBPerson,
  treeData: { families: PBFamily[]; people: PBPerson[] },
  pages?: Record<string, number>,
): Promise<OroksegJsonGedcomData> {
  const converter = new TopolaConverter(treeData, pages);
  await converter.addPerson(person);
  return converter.getTopolaData();
}

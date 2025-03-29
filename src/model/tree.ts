import { Family, Media, MediaRef, Person } from "../api/model";
import {
  PBFamily,
  PBMediumRef,
  PBPerson,
  PBTreeData,
} from "../pages/photoBookModel";

export class TreeBuilder {
  private clientUrl: string;

  constructor(clientUrl: string) {
    this.clientUrl = clientUrl;
  }

  async fetchMedium(mediumRef: MediaRef) {
    const res = await fetch(`${this.clientUrl}/media/byRef/${mediumRef.ref}`);
    if (!res.ok) {
      console.error(res.statusText);
      throw new Error(res.statusText);
    }
    const medium: Media = await res.json();
    // return medium;
    return {
      ...mediumRef,
      contentUrl: `${this.clientUrl}/media/contentByRef/${mediumRef.ref}`,
      medium,
    } as PBMediumRef;
  }

  async fetchFamilyByGrampsId(famId: String, treeData: PBTreeData) {
    console.log("fetchFamily", famId);
    if (treeData.families.find((f) => f.gramps_id === famId)) {
      return;
    }
    const res = await fetch(`${this.clientUrl}/families/byGrampsId/${famId}`);
    if (!res.ok) {
      console.error(res.statusText);
      throw new Error(res.statusText);
    }
    const family: Family = await res.json();

    console.log("family", famId, family);

    const media_list = await Promise.all(
      family.media_list.map((ref) => this.fetchMedium(ref)),
    );

    const pbFamily = {
      ...family,
      media_list,
    } as PBFamily;

    treeData.families.push(pbFamily);
    return pbFamily;
  }

  async fetchFamilyByRef(famId: String, treeData: PBTreeData) {
    console.log("fetchFamily", famId);

    if (treeData.families.find((p) => p.handle === famId)) {
      return treeData.families.find((p) => p.handle === famId);
    }

    const res = await fetch(`${this.clientUrl}/families/byRef/${famId}`);
    if (!res.ok) {
      console.error(res.statusText);
      throw new Error(res.statusText);
    }
    const family: Family = await res.json();

    console.log("family", famId, family);

    const media_list = await Promise.all(
      family.media_list.map((ref) => this.fetchMedium(ref)),
    );

    const pbFamily = {
      ...family,
      media_list,
    } as PBFamily;

    if (treeData.families.find((p) => p.handle === famId)) {
      return treeData.families.find((p) => p.handle === famId);
    }

    treeData.families.push(pbFamily);
    return pbFamily;
  }

  async fetchEvent(ref?: string) {
    if (!ref) {
      return null;
    }
    const res = await fetch(`${this.clientUrl}/events/byRef/${ref}`);
    if (!res.ok) {
      if (res.status === 404) {
        return null;
      }
      console.error(res.statusText);
      throw new Error(res.statusText);
    }

    const event = await res.json();

    return event;
  }

  async fetchPerson(ref: string, treeData: PBTreeData) {
    if (treeData.people.find((p) => p.handle === ref)) {
      return;
    }

    const res = await fetch(`${this.clientUrl}/people/byRef/${ref}`);
    if (!res.ok) {
      console.error(res.statusText);
      throw new Error(res.statusText);
    }

    const person = (await res.json()) as Person;

    const birthEvent = await this.fetchEvent(
      person.event_ref_list[person.birth_ref_index]?.ref,
    );
    const deathEvent = await this.fetchEvent(
      person.event_ref_list[person.death_ref_index]?.ref,
    );

    const media_list = await Promise.all(
      person.media_list.map((ref) => this.fetchMedium(ref)),
    );

    const pbPerson = {
      ...person,
      birthEvent,
      deathEvent,
      media_list,
    } as PBPerson;

    if (treeData.people.find((p) => p.handle === ref)) {
      return;
    }

    treeData.people.push(pbPerson);
    return pbPerson;
  }

  async ensureChildren(family: PBFamily, treeData: PBTreeData) {
    return await Promise.all(
      family.child_ref_list.map(async (childRef) => {
        return await this.fetchPerson(childRef.ref, treeData);
      }),
    );
  }

  async ensureFamilies(person: PBPerson, treeData: PBTreeData) {
    return await Promise.all(
      person.family_list
        .filter((familyRef) => familyRef !== undefined)
        .map(async (familyRef) => {
          return await this.fetchFamilyByRef(familyRef, treeData);
        }),
    );
  }

  async ensureParents(family: PBFamily, treeData: PBTreeData) {
    return Promise.all(
      [family.father_handle, family.mother_handle]
        .filter(
          (parentHandle) => parentHandle !== undefined && parentHandle !== null,
        )
        .map(async (parentHandle) => {
          return await this.fetchPerson(parentHandle, treeData);
        }),
    );
  }

  async ensureParentFamilies(
    personRef: string,
    treeData: PBTreeData,
  ): Promise<PBFamily[]> {
    const person = treeData.people.find((p) => p.handle === personRef);
    if (!person) {
      return [];
    }
    const fams = await Promise.all(
      person.parent_family_list
        .filter((familyRef) => familyRef !== undefined)
        .map(async (familyRef) => {
          return await this.fetchFamilyByRef(familyRef, treeData);
        }),
    );
    return fams.filter((f) => f !== undefined);
  }

  async goDown(family: PBFamily, down: number, treeData: PBTreeData) {
    if (down === 0) {
      return;
    }

    const famRefs = family.child_ref_list
      .map((childRef) => {
        return treeData.people.find((p) => p.handle === childRef.ref);
      })
      .flatMap((p) => p?.family_list)
      .filter((familyRef) => familyRef !== undefined);

    const families = await Promise.all(
      famRefs.map(async (familyRef) => {
        return await this.getFamilyByRef(familyRef, treeData);
      }),
    );

    for (const fam of families) {
      await this.goDown(fam, down - 1, treeData);
    }
  }

  async goUp(family: PBFamily, up: number, treeData: PBTreeData) {
    if (up === 0) {
      return;
    }

    const famRefs = [family.father_handle, family.mother_handle]
      .map((parentHandle) => {
        return treeData.people.find((p) => p.handle === parentHandle);
      })
      .flatMap((p) => p?.parent_family_list)
      .filter((familyRef) => familyRef !== undefined);

    const families = await Promise.all(
      famRefs.map(async (familyRef) => {
        return await this.getFamilyByRef(familyRef, treeData);
      }),
    );

    for (const fam of families) {
      await this.goUp(fam, up - 1, treeData);
    }
  }

  async getFamilyByRef(ref: string, treeData: PBTreeData) {
    const family =
      treeData.families.find((f) => f.handle === ref) ||
      (await this.fetchFamilyByRef(ref, treeData));
    if (!family) {
      throw new Error("Family not found");
    }
    await this.ensureParents(family, treeData);

    const parentFamilies = (
      await Promise.all(
        [family.father_handle, family.mother_handle].map((parentHandle) => {
          return this.ensureParentFamilies(parentHandle, treeData);
        }),
      )
    ).reduce((acc, val) => acc.concat(val), []);

    await Promise.all(
      parentFamilies.map((f) => this.ensureParents(f, treeData)),
    );

    await this.ensureChildren(family, treeData);
    if (!treeData.familiesToDisplay.includes(family)) {
      treeData.familiesToDisplay.push(family);
    }
    return family;
  }

  async getFamilyByGrampsId(famGrampsId: string, treeData: PBTreeData) {
    const family = await this.fetchFamilyByGrampsId(famGrampsId, treeData);
    if (!family) {
      throw new Error("Family not found");
    }
    await this.ensureParents(family, treeData);

    const parentFamilies = (
      await Promise.all(
        [family.father_handle, family.mother_handle].map((parentHandle) => {
          return this.ensureParentFamilies(parentHandle, treeData);
        }),
      )
    ).reduce((acc, val) => acc.concat(val), []);

    await Promise.all(
      parentFamilies.map((f) => this.ensureParents(f, treeData)),
    );

    await this.ensureChildren(family, treeData);
    if (!treeData.familiesToDisplay.includes(family)) {
      treeData.familiesToDisplay.push(family);
    }
    return family;
  }

  public async generate(
    famGrampsId: string,
    down: number,
    up: number,
  ): Promise<PBTreeData> {
    try {
      const families = [] as PBFamily[];
      const people = [] as PBPerson[];
      const familiesToDisplay = [] as PBFamily[];
      const treeData = { families, people, familiesToDisplay } as PBTreeData;

      console.log("generate");

      const family = await this.getFamilyByGrampsId(famGrampsId, treeData);

      await this.goDown(family, down, treeData);
      await this.goUp(family, up, treeData);

      return treeData;
    } catch (e) {
      console.error(e);
      throw e;
    }
  }
}

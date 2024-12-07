import { useState } from "react";
import { Family, Media, MediaRef, Person } from "../api/model";
import { useParams } from "react-router-dom";
import { PhotoBook } from "../components/PhotoBook";
import { Box, Button, TextField, Typography } from "@mui/material";
import { PBFamily, PBMediumRef, PBPerson, PBTreeData } from "./photoBookModel";
import { FmdBad, People } from "@mui/icons-material";
import { tree } from "d3-hierarchy";


export type PhotoBookParams = {
  famGrampsId: string;
};

export function PhotoBookPage() {

  // Get the query parameter name 'url' from the current URL
  const clientUrl = new URLSearchParams(window.location.search).get("url");

  const { famGrampsId } = useParams<PhotoBookParams>();

  const [treeData, setTreeData] = useState({ families: [], people: [], familiesToDisplay: []} as PBTreeData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null as unknown | null);

  const fetchMedium = async (mediumRef: MediaRef) => {
    const res = await fetch(`${clientUrl}/media/byRef/${mediumRef.ref}`);
    if (!res.ok) {
      console.error(res.statusText);
      throw new Error(res.statusText);
    }
    const medium: Media = await res.json();
    // return medium;
    return {
      ...mediumRef,
      contentUrl: `${clientUrl}/media/contentByRef/${mediumRef.ref}`,
      medium,
    } as PBMediumRef;
  };

  const fetchFamilyByGrampsId = async (famId: String, treeData: PBTreeData) => {
    console.log("fetchFamily", famId);
    if (treeData.families.find((f) => f.gramps_id === famId)) {
      return;
    }
    const res = await fetch(`${clientUrl}/families/byGrampsId/${famId}`);
    if (!res.ok) {
      console.error(res.statusText);
      throw new Error(res.statusText);
    }
    const family: Family = await res.json();

    console.log("family", famId, family);

    const media_list = await Promise.all(family.media_list.map(fetchMedium));

    const pbFamily = {
      ...family,
      media_list
    } as PBFamily;

    treeData.families.push(pbFamily);
    return pbFamily
  };

  const fetchFamilyByRef = async (famId: String, treeData: PBTreeData) => {
    console.log("fetchFamily", famId);    
    const res = await fetch(`${clientUrl}/families/byRef/${famId}`);
    if (!res.ok) {
      console.error(res.statusText);
      throw new Error(res.statusText);
    }
    const family: Family = await res.json();

    console.log("family", famId, family);

    const media_list = await Promise.all(family.media_list.map(fetchMedium));

    const pbFamily = {
      ...family,
      media_list
    } as PBFamily;


    if (treeData.families.find((p) => p.handle === famId)) {
      return treeData.families.find((p) => p.handle === famId);
    }

    treeData.families.push(pbFamily);
    return pbFamily
  };

  async function fetchEvent(ref?: string) {
    if (!ref) {
      return null;
    }
    const res = await fetch(`${clientUrl}/events/byRef/${ref}`);
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

  async function fetchPerson(ref: string, treeData: PBTreeData) {
    if (treeData.people.find((p) => p.handle === ref)) {
      return;
    }
      
    const res = await fetch(`${clientUrl}/people/byRef/${ref}`);
    if (!res.ok) {
      console.error(res.statusText);
      throw new Error(res.statusText);
    }

    const person = await res.json() as Person;

    const birthEvent = await fetchEvent(person.event_ref_list[person.birth_ref_index]?.ref);
    const deathEvent = await fetchEvent(person.event_ref_list[person.death_ref_index]?.ref);


    const media_list = await Promise.all(person.media_list.map(fetchMedium));

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



  const ensureChildren = async (family: PBFamily, treeData: PBTreeData) => {
    return await Promise.all(family.child_ref_list.map(async (childRef) => {
      return await fetchPerson(childRef.ref, treeData);
    }));
  }

  const ensureFamilies = async (person: PBPerson, treeData: PBTreeData) => {
    return await Promise.all(person.family_list.filter(familyRef => familyRef !== undefined).map(async (familyRef) => {
      return await fetchFamilyByRef(familyRef, treeData);
    }));
  }
  
  const ensureParents = async (family: PBFamily, treeData: PBTreeData) => {
    return Promise.all([family.father_handle, family.mother_handle]
      .filter((parentHandle) => parentHandle !== undefined && parentHandle !== null)
      .map(async (parentHandle) => {
      return await fetchPerson(parentHandle, treeData);
    }));
  }

  const ensureParentFamilies = async (personRef: string, treeData: PBTreeData): Promise<PBFamily[]> => {
    const person = treeData.people.find((p) => p.handle === personRef);
    if (!person) {
      return [];
    }
    const fams = await Promise.all(
      person.parent_family_list.filter(familyRef => familyRef !== undefined).map(async (familyRef) => {
      return await fetchFamilyByRef(familyRef, treeData);
      }));
    return fams.filter(f => f !== undefined);
  }


  const goDown = async (family: PBFamily, down: number, treeData: PBTreeData) => {
    if (down === 0) {
      return;
    }


    const famRefs = family.child_ref_list.map((childRef) => {
      return treeData.people.find((p) => p.handle === childRef.ref);
    })
      .flatMap((p) => p?.family_list)
      .filter(familyRef => familyRef !== undefined);

    const families = await Promise.all(famRefs.map(async (familyRef) => {
      return await getFamilyByRef(familyRef, treeData);
    }));
    
    for (const fam of families) {
      await goDown(fam, down - 1, treeData);
    }
  };


  const goUp = async (family: PBFamily, up: number, treeData: PBTreeData) => {
    if (up === 0) {
      return;
    }

    const famRefs = [family.father_handle, family.mother_handle].map((parentHandle) => {
      return treeData.people.find((p) => p.handle === parentHandle);
    })
      .flatMap((p) => p?.parent_family_list)
      .filter(familyRef => familyRef !== undefined);

    const families = await Promise.all(famRefs.map(async (familyRef) => {
      return await getFamilyByRef(familyRef, treeData);
    }));
    
    for (const fam of families) {
      await goUp(fam, up - 1, treeData);
    }
  };


  const getFamilyByRef = async (ref: string, treeData: PBTreeData) => {
    const family = treeData.families.find((f) => f.handle === ref) || 
    await fetchFamilyByRef(ref, treeData);
    if (!family) {
      throw new Error("Family not found");
    }
    await ensureParents(family, treeData);

    const parentFamilies = (await Promise.all([family.father_handle, family.mother_handle].map((parentHandle) => {
      return ensureParentFamilies(parentHandle, treeData);
    }))).reduce((acc, val) => acc.concat(val), []);

    await Promise.all(parentFamilies.map((f) => ensureParents(f, treeData)));

    await ensureChildren(family, treeData);
    if (!treeData.familiesToDisplay.includes(family)) {
      treeData.familiesToDisplay.push(family);
    }
    return family;
  }

  const getFamilyByGrampsId = async (famGrampsId: string, treeData: PBTreeData) => {
    const family = await fetchFamilyByGrampsId(famGrampsId, treeData);
    if (!family) {
      throw new Error("Family not found");
    }
    await ensureParents(family, treeData);

    const parentFamilies = (await Promise.all([family.father_handle, family.mother_handle].map((parentHandle) => {
      return ensureParentFamilies(parentHandle, treeData);
    }))).reduce((acc, val) => acc.concat(val), []);

    await Promise.all(parentFamilies.map((f) => ensureParents(f, treeData)));

    await ensureChildren(family, treeData);
    if (!treeData.familiesToDisplay.includes(family)) {
      treeData.familiesToDisplay.push(family);
    }
    return family;
  }




  const generate = async (
    famGrampsId: string | undefined,
    down: number,
    up: number,
  ) => {
    if (!famGrampsId) {
      console.error("No family id");
      return;
    }
    console.log("generate");
    try {
      setLoading(true);
      setError(null);
      setTreeData({ families: [], people: [], familiesToDisplay: [] });
      
      const families = [] as PBFamily[];
      const people = [] as PBPerson[];
      const familiesToDisplay = [] as PBFamily[];
      const treeData = { families, people, familiesToDisplay };
      const family = await getFamilyByGrampsId(famGrampsId, treeData);
      
      await goDown(family, down, treeData);
      await goUp(family, up, treeData);

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
        <Box sx={{ display: "flex", alignItems: "center" }}>
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
            onClick={() => generate(famGrampsId, generationDown, generationUp)}
            variant="contained"
          >
            Generate
          </Button>
        </Box>
      </div>

      <div className="photoBook">
        {loading && <div>Loading...</div>}
        {!!error && <div>Error: {`${error}`}</div>}
        <pre>
          {!error && !loading && false &&
            <> 
            <h2>Families</h2>
            <ul>
              {treeData.familiesToDisplay.map((f) => {
                return (
                  <li key={f.handle}>
                    {f.gramps_id}
                  </li>
                );
              })}
            </ul>
            <h2>People</h2>
            <ul>
              {treeData.people.map((p) => {
                return (
                  <li key={p.handle}>
                    {`${p.gramps_id} - ${p.primary_name.first_name}`}
                  </li>
                );
              })}
            </ul>

            <h2>Families</h2>
            <ul>
              {treeData.families.map((p) => {
                return (
                  <li key={p.handle}>
                    {`${p.gramps_id}`}
                  </li>
                );
              })}
            </ul>
          </> }
        </pre>
        
        {!error && !loading && <PhotoBook treeData={treeData} title={title} />}
      </div>
    </div>
  );
}

import { Family, Person, Event, MediaRef, Media } from "../api/model";

export type PBFamily = Family & {
  // children?: PBPerson[];
  // father?: PBPerson;
  // mother?: PBPerson;
  media?: any[];
  media_list: PBMediumRef[];
};

export type PBPerson = Person & {
  // families: PBFamily[];
  // parentFamilies: PBFamily[];
  birthEvent: Event;
  deathEvent: Event;
  media_list: PBMediumRef[];
};

export type PBMediumRef = MediaRef & {
  contentUrl: string;
  medium: Media;
};

export type PBTreeData = {
  familiesToDisplay: PBFamily[];
  families: PBFamily[];
  people: PBPerson[];
};

export type PBCoreData = {
  treeData: PBTreeData;
  familiesToDisplay: PBFamily[];
};

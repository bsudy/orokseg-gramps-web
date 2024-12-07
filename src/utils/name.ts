import { Maybe } from "graphql/jsutils/Maybe";
import { Name } from "../api/model";

export const displayName = (name?: Maybe<Name> | Name) => {
  if (name) {
    const surname = displaySurname(name);
    const firstname = displayFirstname(name);
    return `${surname}, ${firstname}`.trim();
  }
  return "<Unknown>";
};

export function displaySurname(name?: Maybe<Name> | Name) {
  if (name) {
    return name.surname_list
      .map((surname) => `${surname.prefix} ${surname.surname}`)
      .join(" ")
      .trim();
  }
  return "<Unknown>";
}

export function displayFirstname(name?: Maybe<Name> | Name) {
  if (name) {
    return `${name.first_name} ${name.suffix}`.trim();
  }
  return "<Unknown>";
}

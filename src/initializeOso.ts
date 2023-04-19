import { Oso } from "oso";
import { Classroom, Session, User } from "./model";

export async function initializeOso() {
  const oso = new Oso();

  // register classes before loading polar policy, to prevent warnings
  oso.registerClass(User);
  oso.registerClass(Classroom);
  oso.registerClass(Session);

  await oso.loadFiles(["gsb.polar"]);

  return oso;
}

import type {
  Space as ApiSpace,
  Due as ApiDue,
  JoinableDepartment as ApiJoinable,
  EmblemHue,
} from "@/lib/api/types";
import type { Space, Due, JoinableDepartment } from "./types";

const HUES: EmblemHue[] = ["emerald", "indigo", "amber", "rose", "slate"];

/** Stable emblem hue when the API doesn't supply one (keyed off the id). */
function hueFor(space: { hue?: EmblemHue; id: string }): EmblemHue {
  if (space.hue && HUES.includes(space.hue)) return space.hue;
  let sum = 0;
  for (const ch of space.id) sum += ch.charCodeAt(0);
  return HUES[sum % HUES.length];
}

/** API space → dues-wall space (kobo amounts converted elsewhere; adds emblem hue). */
export function adaptSpace(api: ApiSpace): Space {
  return {
    id: api.id,
    name: api.name,
    short: api.short,
    kind: api.kind,
    membership: api.membership === "guest" ? "guest" : "member",
    hue: hueFor(api),
    memberCount: api.memberCount,
  };
}

/** API due → dues-wall due. Students are charged `payableAmount` (face + 3% fee),
 * so that's what we show/settle; kobo → naira. */
export function adaptDue(api: ApiDue): Due {
  // Join-code preview dues come back with a rep status ("active"); treat anything
  // that isn't a settled/overdue student status as unpaid.
  const status: Due["status"] =
    api.status === "paid" || api.status === "overdue" ? api.status : "unpaid";
  return {
    id: api.id,
    spaceId: api.spaceId,
    title: api.title,
    note: api.note ?? "",
    amount: (api.payableAmount ?? api.amount) / 100,
    dueDate: api.dueDate,
    status,
    category: api.category,
  };
}

/** API join-code preview → the card's joinable department. */
export function adaptJoinable(api: ApiJoinable): JoinableDepartment {
  return {
    ...adaptSpace(api),
    code: api.code,
    about: api.about ?? "",
    faculty: api.faculty ?? "",
    dues: (api.dues ?? []).map(adaptDue),
  };
}

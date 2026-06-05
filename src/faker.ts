// Deterministic fake data generator — no dependencies

let seed = 12345;
function rand(): number { seed = (seed * 1664525 + 1013904223) & 0xffffffff; return (seed >>> 0) / 0xffffffff; }
function pick<T>(arr: T[]): T { return arr[Math.floor(rand() * arr.length)]!; }
function randInt(min: number, max: number): number { return Math.floor(rand() * (max - min + 1)) + min; }

const FIRST_NAMES = ["Alice","Bob","Carol","David","Eve","Frank","Grace","Henry","Iris","Jack","Kate","Leo","Mia","Noah","Olivia","Paul","Quinn","Rachel","Sam","Tina","Uma","Victor","Wendy","Xavier","Yara","Zoe"];
const LAST_NAMES = ["Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis","Wilson","Anderson","Taylor","Thomas","Moore","Jackson","Martin","Lee","White","Harris","Clark","Lewis","Robinson"];
const DOMAINS = ["gmail.com","outlook.com","yahoo.com","example.com","proton.me","hey.com","fastmail.com"];
const LOREM = "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua".split(" ");
const COMPANIES = ["Acme Corp","Globex Inc","Initech","Hooli","Pied Piper","Dunder Mifflin","Stark Industries","Wayne Enterprises","Umbrella Corp","Weyland Corp"];
const STREETS = ["Main St","Oak Ave","Maple Dr","Park Blvd","Cedar Lane","Elm St","Washington Ave","Lincoln Blvd","Madison St","Jefferson Ave"];
const CITIES = ["New York","Los Angeles","Chicago","Houston","Phoenix","Philadelphia","San Antonio","San Diego","Dallas","San Jose","Austin","Jacksonville","San Francisco","Seattle","Denver"];
const COUNTRIES = ["US","GB","CA","AU","DE","FR","JP","NL","SE","NO","DK","FI","CH","NZ","SG"];
const STATUSES = ["active","inactive","pending","suspended","verified"];
const TAGS = ["featured","popular","new","sale","premium","limited","trending","bestseller","exclusive","recommended"];

const UUID_POOL = Array.from({ length: 200 }, () => {
  const h = () => Math.floor(rand() * 16).toString(16);
  return `${Array(8).fill(0).map(h).join("")}-${Array(4).fill(0).map(h).join("")}-4${Array(3).fill(0).map(h).join("")}-${(8 + Math.floor(rand() * 4)).toString(16)}${Array(3).fill(0).map(h).join("")}-${Array(12).fill(0).map(h).join("")}`;
});

let uuidIdx = 0;
function uuid(): string { return UUID_POOL[uuidIdx++ % UUID_POOL.length]!; }

function isoDate(daysAgo = 0, variance = 30): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo - randInt(0, variance));
  return d.toISOString();
}

export type FakeType = "string" | "number" | "integer" | "boolean" | "array" | "object";

export interface FieldHint {
  name: string;
  type?: FakeType;
  format?: string;
  enum?: unknown[];
  items?: { type?: FakeType; properties?: Record<string, FieldHint> };
  properties?: Record<string, FieldHint>;
  minimum?: number;
  maximum?: number;
}

export function fakeValue(hint: FieldHint): unknown {
  const name = hint.name.toLowerCase();

  if (hint.enum && hint.enum.length > 0) return pick(hint.enum as unknown[]);

  if (hint.type === "boolean") return rand() > 0.3;
  if (hint.type === "array") {
    const count = randInt(1, 4);
    return Array.from({ length: count }, () =>
      hint.items?.properties
        ? fakeObject(hint.items.properties)
        : fakeValue({ name: "item", type: hint.items?.type ?? "string" })
    );
  }
  if (hint.type === "object" && hint.properties) return fakeObject(hint.properties);

  if (hint.type === "number" || hint.type === "integer") {
    const min = hint.minimum ?? 0;
    const max = hint.maximum ?? (name.includes("price") || name.includes("amount") || name.includes("cost") ? 9999 : 1000);
    const val = randInt(min, max);
    return hint.type === "number" ? parseFloat((val + rand()).toFixed(2)) : val;
  }

  if (hint.format === "date-time" || hint.format === "datetime" || name.includes("_at") || name.includes("date") || name.includes("time")) return isoDate(randInt(0, 90));
  if (hint.format === "email" || name.includes("email")) {
    const fn = pick(FIRST_NAMES).toLowerCase();
    return `${fn}.${pick(LAST_NAMES).toLowerCase()}@${pick(DOMAINS)}`;
  }
  if (hint.format === "uuid" || name === "id" || name.endsWith("_id") || name.endsWith("Id")) return uuid();
  if (hint.format === "uri" || hint.format === "url" || name.includes("url") || name.includes("link") || name.includes("image") || name.includes("avatar") || name.includes("photo")) {
    if (name.includes("image") || name.includes("avatar") || name.includes("photo") || name.includes("thumbnail")) return `https://picsum.photos/seed/${randInt(1, 999)}/400/300`;
    return `https://example.com/${name.replace(/_url|url/g, "").replace(/_/g, "-")}/${randInt(1, 9999)}`;
  }
  if (name.includes("phone") || name.includes("mobile") || name.includes("tel")) return `+1${randInt(2,9)}${String(randInt(100000000,999999999))}`;
  if (name === "name" || name.includes("full_name") || name.includes("fullname") || name.includes("display_name")) return `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
  if (name.includes("first_name") || name === "firstname") return pick(FIRST_NAMES);
  if (name.includes("last_name") || name === "lastname") return pick(LAST_NAMES);
  if (name.includes("username") || name.includes("handle") || name.includes("slug")) return `${pick(FIRST_NAMES).toLowerCase()}_${randInt(10,9999)}`;
  if (name.includes("company") || name.includes("organization") || name.includes("brand")) return pick(COMPANIES);
  if (name.includes("city")) return pick(CITIES);
  if (name.includes("country")) return pick(COUNTRIES);
  if (name.includes("street") || name.includes("address")) return `${randInt(1,9999)} ${pick(STREETS)}`;
  if (name.includes("zip") || name.includes("postal")) return String(randInt(10000,99999));
  if (name.includes("status") || name.includes("state")) return pick(STATUSES);
  if (name.includes("tag") || name.includes("label") || name.includes("category")) return pick(TAGS);
  if (name.includes("title") || name.includes("subject") || name.includes("heading")) return LOREM.slice(randInt(0,5), randInt(6,12)).join(" ");
  if (name.includes("description") || name.includes("body") || name.includes("content") || name.includes("summary") || name.includes("bio") || name.includes("note")) {
    return LOREM.slice(0, randInt(15, 30)).join(" ") + ".";
  }
  if (name.includes("color") || name.includes("colour")) return `#${randInt(0,255).toString(16).padStart(2,"0")}${randInt(0,255).toString(16).padStart(2,"0")}${randInt(0,255).toString(16).padStart(2,"0")}`;
  if (name.includes("lat") || name === "latitude") return parseFloat((rand() * 180 - 90).toFixed(6));
  if (name.includes("lon") || name.includes("lng") || name === "longitude") return parseFloat((rand() * 360 - 180).toFixed(6));
  if (name.includes("version") || name.includes("semver")) return `${randInt(0,3)}.${randInt(0,15)}.${randInt(0,99)}`;

  return LOREM.slice(randInt(0,10), randInt(11,20)).join(" ");
}

export function fakeObject(properties: Record<string, FieldHint>): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  for (const [key, hint] of Object.entries(properties)) {
    obj[key] = fakeValue({ ...hint, name: hint.name || key });
  }
  return obj;
}

export function fakeList(properties: Record<string, FieldHint>, count: number): Record<string, unknown>[] {
  return Array.from({ length: count }, () => fakeObject(properties));
}

export function fakeNestedObject(depth: number, keys: string[]): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  for (const key of keys) {
    if (depth > 0 && Math.random() > 0.7) {
      obj[key] = fakeNestedObject(depth - 1, keys.slice(0, 3));
    } else {
      obj[key] = fakeValue({ name: key, type: "string" });
    }
  }
  return obj;
}

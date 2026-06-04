import * as fs from "fs";
import * as path from "path";

export interface ParsedEndpoint {
  method: string;
  path: string;
  summary?: string;
  statusCode: number;
  responseSchema: Record<string, unknown> | null;
  isList: boolean;
  itemCount: number;
  delay: number;
}

export interface ParsedSpec {
  title: string;
  version: string;
  basePath: string;
  endpoints: ParsedEndpoint[];
}

function resolveRef(schema: Record<string, unknown>, components: Record<string, unknown>): Record<string, unknown> {
  if (schema["$ref"] && typeof schema["$ref"] === "string") {
    const refPath = (schema["$ref"] as string).replace("#/components/schemas/", "").replace("#/definitions/", "");
    const schemas = (components["schemas"] ?? (components as Record<string, unknown>)) as Record<string, unknown>;
    return resolveRef((schemas[refPath] ?? {}) as Record<string, unknown>, components);
  }
  return schema;
}

function extractProperties(schema: Record<string, unknown>, components: Record<string, unknown>): Record<string, { type?: string; format?: string; enum?: unknown[]; name: string }> {
  const resolved = resolveRef(schema, components);
  if (resolved["type"] === "array") {
    const items = resolveRef((resolved["items"] ?? {}) as Record<string, unknown>, components);
    return extractProperties(items, components);
  }
  const props = resolved["properties"] as Record<string, Record<string, unknown>> ?? {};
  const result: Record<string, { type?: string; format?: string; enum?: unknown[]; name: string }> = {};
  for (const [k, v] of Object.entries(props)) {
    const resolved2 = resolveRef(v, components);
    result[k] = { name: k, type: resolved2["type"] as string, format: resolved2["format"] as string, enum: resolved2["enum"] as unknown[] };
  }
  return result;
}

export function parseOpenAPI(specPath: string): ParsedSpec {
  const raw = fs.readFileSync(specPath, "utf-8");
  let spec: Record<string, unknown>;
  try { spec = JSON.parse(raw); } catch { spec = parseYaml(raw); }

  const info = spec["info"] as Record<string, unknown> ?? {};
  const components = (spec["components"] ?? spec["definitions"] ?? {}) as Record<string, unknown>;
  const paths = spec["paths"] as Record<string, Record<string, unknown>> ?? {};
  const servers = spec["servers"] as Array<{ url: string }> ?? [];
  const basePath = servers[0]?.url?.replace(/https?:\/\/[^/]+/, "") ?? spec["basePath"] as string ?? "/api";

  const endpoints: ParsedEndpoint[] = [];

  for (const [urlPath, methods] of Object.entries(paths)) {
    for (const [method, opRaw] of Object.entries(methods)) {
      if (!["get","post","put","patch","delete"].includes(method)) continue;
      const op = opRaw as Record<string, unknown>;
      const responses = op["responses"] as Record<string, Record<string, unknown>> ?? {};
      const successCode = Object.keys(responses).find(c => c.startsWith("2")) ?? "200";
      const successResp = responses[successCode] ?? {};
      const content = successResp["content"] as Record<string, Record<string, unknown>>;
      const jsonContent = content?.["application/json"];
      const schema = resolveRef((jsonContent?.["schema"] ?? {}) as Record<string, unknown>, components);
      const isList = schema["type"] === "array";
      const properties = extractProperties(schema, components);

      endpoints.push({
        method: method.toUpperCase(),
        path: urlPath,
        summary: op["summary"] as string,
        statusCode: parseInt(successCode),
        responseSchema: Object.keys(properties).length > 0 ? properties : null,
        isList: isList || (method === "get" && !urlPath.match(/\{[^}]+\}$/)),
        itemCount: 8,
        delay: 0,
      });
    }
  }

  return { title: info["title"] as string ?? "Mock API", version: info["version"] as string ?? "1.0.0", basePath, endpoints };
}

function parseYaml(yaml: string): Record<string, unknown> {
  // Minimal YAML parser for OpenAPI subset
  const lines = yaml.split("\n");
  const result: Record<string, unknown> = {};
  const stack: Array<{ obj: Record<string, unknown>; indent: number; key: string }> = [{ obj: result, indent: -1, key: "" }];

  for (const line of lines) {
    const trimmed = line.trimStart();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const indent = line.length - trimmed.length;
    const colonIdx = trimmed.indexOf(":");
    if (colonIdx === -1) continue;
    const key = trimmed.slice(0, colonIdx).trim();
    const value = trimmed.slice(colonIdx + 1).trim();

    while (stack.length > 1 && stack[stack.length - 1]!.indent >= indent) stack.pop();
    const parent = stack[stack.length - 1]!.obj;

    if (!value) {
      const newObj: Record<string, unknown> = {};
      parent[key] = newObj;
      stack.push({ obj: newObj, indent, key });
    } else {
      if (value === "true") parent[key] = true;
      else if (value === "false") parent[key] = false;
      else if (value === "null") parent[key] = null;
      else if (!isNaN(Number(value))) parent[key] = Number(value);
      else parent[key] = value.replace(/^["']|["']$/g, "");
    }
  }
  return result;
}

export function buildDefaultEndpoints(resourceName: string): ParsedEndpoint[] {
  const r = resourceName.toLowerCase().replace(/\s+/g, "-");
  const defaultProps: Record<string, { name: string; type: string; format?: string }> = {
    id: { name: "id", type: "string", format: "uuid" },
    name: { name: "name", type: "string" },
    email: { name: "email", type: "string", format: "email" },
    status: { name: "status", type: "string" },
    created_at: { name: "created_at", type: "string", format: "date-time" },
    updated_at: { name: "updated_at", type: "string", format: "date-time" },
  };

  return [
    { method: "GET", path: `/${r}s`, summary: `List all ${r}s`, statusCode: 200, responseSchema: defaultProps, isList: true, itemCount: 8, delay: 0 },
    { method: "GET", path: `/${r}s/{id}`, summary: `Get ${r} by ID`, statusCode: 200, responseSchema: defaultProps, isList: false, itemCount: 1, delay: 0 },
    { method: "POST", path: `/${r}s`, summary: `Create a ${r}`, statusCode: 201, responseSchema: defaultProps, isList: false, itemCount: 1, delay: 0 },
    { method: "PUT", path: `/${r}s/{id}`, summary: `Update a ${r}`, statusCode: 200, responseSchema: defaultProps, isList: false, itemCount: 1, delay: 0 },
    { method: "DELETE", path: `/${r}s/{id}`, summary: `Delete a ${r}`, statusCode: 204, responseSchema: null, isList: false, itemCount: 0, delay: 0 },
  ];
}

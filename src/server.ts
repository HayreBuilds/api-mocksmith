import * as http from "http";
import type { ParsedSpec, ParsedEndpoint } from "./parser.js";
import { fakeObject, fakeList } from "./faker.js";
import type { FieldHint } from "./faker.js";

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

function matchRoute(endpoints: ParsedEndpoint[], method: string, urlPath: string): { endpoint: ParsedEndpoint; params: Record<string, string> } | null {
  for (const endpoint of endpoints) {
    if (endpoint.method !== method.toUpperCase()) continue;
    const epParts = endpoint.path.split("/").filter(Boolean);
    const reqParts = urlPath.split("/").filter(Boolean);
    if (epParts.length !== reqParts.length) continue;
    const params: Record<string, string> = {};
    let match = true;
    for (let i = 0; i < epParts.length; i++) {
      const ep = epParts[i]!;
      const rq = reqParts[i]!;
      if (ep.startsWith("{") && ep.endsWith("}")) { params[ep.slice(1, -1)] = rq; }
      else if (ep !== rq) { match = false; break; }
    }
    if (match) return { endpoint, params };
  }
  return null;
}

function generateResponse(endpoint: ParsedEndpoint): unknown {
  if (endpoint.statusCode === 204 || !endpoint.responseSchema) return null;
  const hints = endpoint.responseSchema as Record<string, FieldHint>;
  if (endpoint.isList) {
    return { data: fakeList(hints, endpoint.itemCount), total: endpoint.itemCount, page: 1, per_page: endpoint.itemCount };
  }
  return fakeObject(hints);
}

export function createMockServer(spec: ParsedSpec, port: number, verbose: boolean): http.Server {
  const server = http.createServer(async (req, res) => {
    const urlPath = (req.url ?? "/").split("?")[0] ?? "/";
    const baseless = spec.basePath !== "/" ? urlPath.replace(spec.basePath, "") : urlPath;

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("X-Mock-Server", "api-mocksmith");

    if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }

    if (urlPath === "/mocksmith-routes" || urlPath === "/") {
      const routes = spec.endpoints.map(e => ({ method: e.method, path: e.path, summary: e.summary }));
      res.writeHead(200);
      res.end(JSON.stringify({ title: spec.title, version: spec.version, routes }, null, 2));
      return;
    }

    const matched = matchRoute(spec.endpoints, req.method ?? "GET", baseless);

    if (!matched) {
      res.writeHead(404);
      res.end(JSON.stringify({ error: "Not Found", path: urlPath, available: spec.endpoints.map(e => `${e.method} ${spec.basePath}${e.path}`) }));
      if (verbose) console.log(`  404  ${req.method} ${urlPath}`);
      return;
    }

    const { endpoint } = matched;
    if (endpoint.delay > 0) await sleep(endpoint.delay);

    const body = generateResponse(endpoint);
    res.writeHead(endpoint.statusCode);
    res.end(body === null ? "" : JSON.stringify(body, null, 2));

    if (verbose) console.log(`  ${endpoint.statusCode}  ${req.method} ${urlPath}`);
  });

  return server;
}

// TODO: Add ?page=&per_page= query param support for list endpoints
// Currently returns all items (count) in one response
// Implement: slice data array based on page/per_page, update total/page fields

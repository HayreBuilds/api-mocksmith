#!/usr/bin/env node
import * as fs from "fs";
import * as path from "path";
import { parseOpenAPI, buildDefaultEndpoints } from "./parser.js";
import { createMockServer } from "./server.js";
import type { ParsedSpec } from "./parser.js";

const VERSION = "1.0.0";
const HELP = `
api-mocksmith v${VERSION} — Instant mock API server

Usage:
  api-mocksmith openapi.yaml          Serve mock from OpenAPI spec
  api-mocksmith openapi.json          Supports JSON or YAML
  api-mocksmith --resource user       Generate CRUD mock for a resource
  api-mocksmith --resource "product, order, review"

Options:
  --port <port>        Port to listen on (default: 3001)
  --delay <ms>         Add artificial response delay (default: 0)
  --count <n>          Number of items in list responses (default: 8)
  --resource <name>    Generate CRUD endpoints for named resources
  --base-path <path>   API base path (default: /api)
  --verbose            Log all requests
  -v, --version        Print version
  -h, --help           Show help

Examples:
  api-mocksmith ./openapi.yaml
  api-mocksmith --resource user --port 4000
  api-mocksmith --resource "product, cart, order" --count 12 --delay 200
  api-mocksmith ./api-spec.json --verbose

Routes:
  GET /mocksmith-routes   List all available mock routes
`;

const R = "\x1b[0m", B = "\x1b[1m", DIM = "\x1b[2m";
const GR = "\x1b[32m", CY = "\x1b[36m", YE = "\x1b[33m", RE = "\x1b[31m", BL = "\x1b[34m";
const c = (col: string, t: string) => process.stdout.isTTY ? `${col}${t}${R}` : t;

function parseArgs(argv: string[]) {
  const opts = { specFile: "", resource: "", port: 3001, delay: 0, count: 8, basePath: "/api", verbose: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === "-h" || a === "--help") { process.stdout.write(HELP); process.exit(0); }
    if (a === "-v" || a === "--version") { process.stdout.write(`api-mocksmith v${VERSION}\n`); process.exit(0); }
    if (a === "--verbose") { opts.verbose = true; continue; }
    if (a === "--port" && argv[i+1]) { opts.port = parseInt(argv[++i]!, 10); continue; }
    if (a === "--delay" && argv[i+1]) { opts.delay = parseInt(argv[++i]!, 10); continue; }
    if (a === "--count" && argv[i+1]) { opts.count = parseInt(argv[++i]!, 10); continue; }
    if (a === "--resource" && argv[i+1]) { opts.resource = argv[++i]!; continue; }
    if (a === "--base-path" && argv[i+1]) { opts.basePath = argv[++i]!; continue; }
    if (!a.startsWith("--") && fs.existsSync(a)) opts.specFile = a;
  }
  return opts;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (!opts.specFile && !opts.resource) { process.stdout.write(HELP); process.exit(0); }

  let spec: ParsedSpec;

  if (opts.specFile) {
    try {
      spec = parseOpenAPI(path.resolve(opts.specFile));
    } catch (e) {
      process.stderr.write(`  ${c(RE,"✖")} Failed to parse spec: ${(e as Error).message}\n`);
      process.exit(1);
    }
  } else {
    const resources = opts.resource.split(",").map(r => r.trim()).filter(Boolean);
    const endpoints = resources.flatMap(r => buildDefaultEndpoints(r));
    for (const e of endpoints) {
      e.itemCount = opts.count;
      e.delay = opts.delay;
    }
    spec = { title: `${resources.join(", ")} Mock API`, version: "1.0.0", basePath: opts.basePath, endpoints };
  }

  for (const e of spec.endpoints) {
    if (opts.delay) e.delay = opts.delay;
    if (opts.count) e.itemCount = opts.count;
  }

  const server = createMockServer(spec, opts.port, opts.verbose);
  server.listen(opts.port, () => {
    process.stdout.write(`\n  ${c(B, c(BL, "◆ api-mocksmith"))} — ${spec.title} v${spec.version}\n\n`);
    process.stdout.write(`  ${c(GR, "✔")} Listening on ${c(CY, `http://localhost:${opts.port}`)}\n`);
    if (spec.basePath !== "/") process.stdout.write(`  ${c(DIM, `Base path: ${spec.basePath}`)}\n`);
    if (opts.delay) process.stdout.write(`  ${c(YE, `⏱ Response delay: ${opts.delay}ms`)}\n`);
    process.stdout.write(`\n  ${c(DIM, "Routes:")}\n`);
    for (const e of spec.endpoints) {
      const method = e.method.padEnd(7);
      const col = e.method === "GET" ? GR : e.method === "POST" ? CY : e.method === "DELETE" ? RE : YE;
      process.stdout.write(`    ${c(col, method)} ${spec.basePath}${e.path}${e.summary ? c(DIM, `  — ${e.summary}`) : ""}\n`);
    }
    process.stdout.write(`\n  ${c(DIM, `GET /mocksmith-routes — list all routes`)}\n`);
    process.stdout.write(`  ${c(DIM, "Press Ctrl+C to stop\n\n")}`);
  });

  process.on("SIGINT", () => { process.stdout.write("\n  Stopped.\n"); server.close(); process.exit(0); });
  process.on("SIGTERM", () => { server.close(); process.exit(0); });
}

main();

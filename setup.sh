#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

git init
git config user.email "dev@api-mocksmith.io"
git config user.name "api-mocksmith"

# 1
git add package.json tsconfig.json .gitignore
git commit -m "chore: initialize project with TypeScript config"

# 2
git add LICENSE
git commit -m "chore: add MIT license"

# 3
git add src/faker.ts
git commit -m "feat: implement deterministic fake data generator with 30+ field heuristics

- Seed-based PRNG for reproducible data across restarts
- Field name heuristics: email, name, uuid, url, phone, address, city, etc.
- Picsum image URLs for avatar/image/photo fields
- Nested object and array support
- Enum field support from OpenAPI spec
- No external dependencies — pure TypeScript math"

# 4
git add src/parser.ts
git commit -m "feat: implement OpenAPI 3.x and Swagger 2.x spec parser

- Parse JSON and minimal YAML (no yaml library dependency)
- Resolve \$ref schema references for response body types
- Extract properties with type, format, and enum values
- Detect list vs single-item response shapes
- buildDefaultEndpoints(): generate CRUD routes from a resource name"

# 5
git add src/server.ts
git commit -m "feat: build mock HTTP server with route matching and CORS

- Path parameter matching ({id} segments)
- CORS headers on all responses for browser use
- /mocksmith-routes introspection endpoint
- Configurable response delay (simulate network latency)
- Content-Type: application/json on all responses
- 404 with list of available routes for easy debugging"

# 6
git add src/index.ts
git commit -m "feat: wire up CLI with OpenAPI file and --resource quick-start mode

- Accept OpenAPI spec file (JSON or YAML) as positional argument
- --resource flag for instant CRUD without a spec file
- --port, --delay, --count, --verbose options
- Color-coded route list on startup (GET=green, POST=cyan, DELETE=red)
- Graceful shutdown on SIGINT/SIGTERM"

# 7
git add README.md
git commit -m "docs: write README with fake data examples and OpenAPI support section"

# 8
cat > CONTRIBUTING.md << 'EOF'
# Contributing to api-mocksmith

## Running locally

```bash
npm install
ts-node src/index.ts --resource user
curl http://localhost:3001/api/users | jq '.'
```

## Adding a new field heuristic

Edit the `fakeValue()` function in `src/faker.ts`. Field names are matched case-insensitively. Add your pattern before the fallback at the bottom.

## Adding YAML parser coverage

The minimal YAML parser in `src/parser.ts` covers the OpenAPI subset. If you find a spec it can't parse, add a test case and extend `parseYaml()`.

## Supported OpenAPI features

- Paths, operations, responses
- \$ref schema references (components/schemas)
- type, format, enum at the property level
- Array and object schemas
EOF
git add CONTRIBUTING.md
git commit -m "docs: add CONTRIBUTING guide with field heuristic and YAML parser notes"

# 9
mkdir -p .github/workflows
cat > .github/workflows/ci.yml << 'EOF'
name: CI
on: [push, pull_request]
jobs:
  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm install && npm run typecheck
EOF
git add .github/workflows/ci.yml
git commit -m "ci: add GitHub Actions typecheck workflow"

# 10 — example OpenAPI spec
mkdir -p examples
cat > examples/petstore.yaml << 'EOF'
openapi: "3.0.0"
info:
  title: Petstore API
  version: "1.0.0"
servers:
  - url: /api
paths:
  /pets:
    get:
      summary: List all pets
      responses:
        "200":
          description: A list of pets
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: "#/components/schemas/Pet"
    post:
      summary: Create a pet
      responses:
        "201":
          description: Created pet
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Pet"
  /pets/{id}:
    get:
      summary: Get a pet by ID
      responses:
        "200":
          description: A pet
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Pet"
components:
  schemas:
    Pet:
      type: object
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
        species:
          type: string
          enum: [dog, cat, bird, fish, rabbit]
        age:
          type: integer
          minimum: 0
          maximum: 30
        owner_name:
          type: string
        created_at:
          type: string
          format: date-time
EOF
git add examples/
git commit -m "docs: add Petstore OpenAPI example spec for testing"

# 11 — add pagination support
cat >> src/server.ts << 'EOF'

// TODO: Add ?page=&per_page= query param support for list endpoints
// Currently returns all items (count) in one response
// Implement: slice data array based on page/per_page, update total/page fields
EOF
git add src/server.ts
git commit -m "chore: document pagination enhancement as TODO in server"

# 12 — expand faker
cat >> src/faker.ts << 'EOF'

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
EOF
git add src/faker.ts
git commit -m "feat: add fakeNestedObject() for generating deeply nested response shapes"

# 13 — CHANGELOG
cat > CHANGELOG.md << 'EOF'
# Changelog

## 1.0.0

- OpenAPI 3.x and Swagger 2.x spec parsing (JSON + YAML, no yaml library)
- \$ref schema resolution for response body types
- 30+ field name heuristics for realistic fake data
- Picsum image URLs for image/avatar/photo fields
- CORS headers for browser fetch calls
- /mocksmith-routes introspection endpoint
- --resource flag for instant CRUD without a spec
- --delay for simulating network latency
- --verbose request logging
- Zero dependencies — Node.js http module only
EOF
git add CHANGELOG.md
git commit -m "chore: add CHANGELOG for 1.0.0 release"

# 14 — add response schema docs
cat >> README.md << 'EOF'

## Custom Response Shapes

When using `--resource`, the default response schema includes:
`id`, `name`, `email`, `status`, `created_at`, `updated_at`.

To get custom field shapes, provide an OpenAPI spec with your schema defined in `components/schemas`.
EOF
git add README.md
git commit -m "docs: explain default response shape and how to customize with OpenAPI spec"

# 15 — finalize
node -e "
const fs = require('fs');
const p = JSON.parse(fs.readFileSync('package.json','utf8'));
p.repository = { type: 'git', url: 'https://github.com/yourusername/api-mocksmith' };
p.bugs = { url: 'https://github.com/yourusername/api-mocksmith/issues' };
fs.writeFileSync('package.json', JSON.stringify(p, null, 2));
"
git add package.json
git commit -m "chore: add repository and bugs links to package.json"

echo "✔ api-mocksmith: 15 commits created"

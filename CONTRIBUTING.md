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

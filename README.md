# api-mocksmith

> Instant mock API server from OpenAPI spec or plain English. Realistic fake data, correct status codes, configurable delays. Zero config.

```
$ api-mocksmith --resource "user, product, order" --port 4000

  ◆ api-mocksmith — user, product, order Mock API v1.0.0

  ✔ Listening on http://localhost:4000

  Routes:
    GET     /api/users          — List all users
    GET     /api/users/{id}     — Get user by ID
    POST    /api/users          — Create a user
    PUT     /api/users/{id}     — Update a user
    DELETE  /api/users/{id}     — Delete a user
    GET     /api/products       ...
    ...

  GET /mocksmith-routes — list all routes
  Press Ctrl+C to stop

$ curl http://localhost:4000/api/users | jq '.'
{
  "data": [
    { "id": "a3f29b1c-...", "name": "Alice Johnson", "email": "alice.johnson@gmail.com", "status": "active", "created_at": "2024-11-23T14:32:01.000Z" },
    ...
  ],
  "total": 8,
  "page": 1,
  "per_page": 8
}
```

---

## Install

```bash
npm install -g api-mocksmith
# or without installing:
npx api-mocksmith --resource user
```

## Usage

```bash
# Mock CRUD for one or more resources
api-mocksmith --resource user
api-mocksmith --resource "product, cart, order, review"

# From an OpenAPI spec
api-mocksmith ./openapi.yaml
api-mocksmith ./api-spec.json

# Custom port
api-mocksmith --resource user --port 4000

# Realistic loading states (add response delay)
api-mocksmith --resource user --delay 300

# More items per list
api-mocksmith --resource product --count 20

# Verbose logging (see every request)
api-mocksmith --resource user --verbose
```

## Response Format

**List endpoints** (`GET /resources`):
```json
{ "data": [...], "total": 8, "page": 1, "per_page": 8 }
```

**Single item** (`GET /resources/{id}`, `POST`, `PUT`):
```json
{ "id": "uuid", "name": "Alice Johnson", "email": "alice@example.com", ... }
```

**Delete** (`DELETE /resources/{id}`): `204 No Content`

## Fake Data

The generator produces realistic data based on field names:
- `id` → UUID
- `email` → realistic email addresses
- `name`, `full_name` → real-sounding names
- `username` → `alice_7823`
- `created_at`, `updated_at` → ISO 8601 timestamps
- `avatar`, `image`, `photo` → real Picsum image URLs
- `price`, `amount`, `cost` → decimal numbers
- `status` → active/inactive/pending/verified
- `url`, `link` → realistic URLs
- `description`, `bio`, `notes` → lorem ipsum prose
- `city`, `country`, `address` → real locations

## OpenAPI Support

Pass any OpenAPI 3.x or Swagger 2.x spec (JSON or YAML):

```bash
api-mocksmith ./petstore.yaml --verbose
api-mocksmith ./openapi.json --port 3001 --delay 200
```

Routes, response schemas, and status codes are read directly from the spec.

## Options

| Option | Default | Description |
|--------|---------|-------------|
| `--port <n>` | 3001 | Port to listen on |
| `--delay <ms>` | 0 | Response delay (simulate network) |
| `--count <n>` | 8 | Items in list responses |
| `--resource <name>` | — | Generate CRUD for named resources |
| `--base-path <path>` | `/api` | API base path |
| `--verbose` | false | Log all requests |

## Zero Dependencies

Only Node.js built-ins. No `express`, no `faker`, no `json-server`. Pure `http` module.

## License

MIT

## Custom Response Shapes

When using `--resource`, the default response schema includes:
`id`, `name`, `email`, `status`, `created_at`, `updated_at`.

To get custom field shapes, provide an OpenAPI spec with your schema defined in `components/schemas`.

## Custom Response Shapes

When using `--resource`, the default response schema includes:
`id`, `name`, `email`, `status`, `created_at`, `updated_at`.

To get custom field shapes, provide an OpenAPI spec with your schema defined in `components/schemas`.

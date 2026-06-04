# 🛠️ api-mocksmith

[![Build Status](https://img.shields.io/github/actions/workflow/status/HayreBuilds/api-mocksmith/ci.yml?branch=main)](https://github.com/HayreBuilds/api-mocksmith/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/HayreBuilds/api-mocksmith/pulls)
[![Star History](https://img.shields.io/github/stars/HayreBuilds/api-mocksmith?style=social)](https://github.com/HayreBuilds/api-mocksmith/stargazers)

**Instant mock API server from OpenAPI spec or plain English. Realistic fake data, correct status codes, configurable delays. Zero config.**

> Frontend developers waiting on a backend team? Tired of hardcoding JSON? **api-mocksmith** spins up a fully functional CRUD API in seconds.

---

## 🚀 Quick Start

```bash
# Mock CRUD for one or more resources instantly
npx api-mocksmith --resource "user, product, order" --port 4000
```

```text
  ◆ api-mocksmith — user, product, order Mock API v1.0.0

  ✔ Listening on http://localhost:4000

  Routes:
    GET     /api/users          — List all users
    GET     /api/users/{id}     — Get user by ID
    POST    /api/users          — Create a user
    PUT     /api/users/{id}     — Update a user
    DELETE  /api/users/{id}     — Delete a user
    ...
```

---

## ✨ Key Features

- **⚡ Zero Configuration**: Start a full CRUD API with one command.
- **📄 OpenAPI Support**: Pass a YAML/JSON spec and get an instant backend.
- **🧠 Context-Aware Mocking**: Generates realistic names, emails, UUIDs, and images based on field names.
- **⏱️ Network Simulation**: Add configurable delays to test loading states.
- **📦 Zero Dependencies**: Built with pure Node.js `http` module. No `express`, no `faker`.

---

## 💻 Installation

```bash
npm install -g api-mocksmith
```

---

## 🛠️ Usage Examples

### Instant CRUD for Multiple Resources
```bash
api-mocksmith --resource "product, cart, order, review"
```

### From an OpenAPI Specification
```bash
api-mocksmith ./openapi.yaml --port 3001 --delay 200
```

### Advanced Options
```bash
# Test loading states with a 300ms delay
api-mocksmith --resource user --delay 300

# Generate larger data sets
api-mocksmith --resource product --count 25

# Log every request for debugging
api-mocksmith --resource user --verbose
```

---

## 🔍 How it Works: Smart Mocking

The engine intelligently maps field names to data types:
- `id` → UUID v4
- `name`, `full_name` → Real-sounding human names
- `email` → Valid-format email addresses
- `avatar`, `photo` → Realistic Unsplash/Picsum URLs
- `price`, `cost` → Formatted currency/decimal numbers
- `status` → Weighted enums (`active`, `pending`, `inactive`)
- `description`, `bio` → Multi-sentence lorem ipsum

---

## ⚙️ Configuration Options

| Option | Default | Description |
|:---|:---|:---|
| `--port <n>` | `3001` | Port to listen on |
| `--delay <ms>` | `0` | Response delay (simulate network latency) |
| `--count <n>` | `8` | Number of items in list responses |
| `--resource <name>`| — | Generate CRUD for specific resources |
| `--base-path <path>`| `/api` | API base path |
| `--verbose` | `false` | Enable detailed request logging |

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 💖 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=HayreBuilds/api-mocksmith&type=Date)](https://star-history.com/#HayreBuilds/api-mocksmith&Date)

---

## 🛡️ Badge

Add this to your own project's README to show you use **api-mocksmith**:

[![api-mocksmith](https://img.shields.io/badge/Mocked--with-api--mocksmith-blue)](https://github.com/HayreBuilds/api-mocksmith)

```md
[![api-mocksmith](https://img.shields.io/badge/Mocked--with-api--mocksmith-blue)](https://github.com/HayreBuilds/api-mocksmith)
```

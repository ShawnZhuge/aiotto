<p align="center">
  <img src="assets/app-icon.png" alt="Aiotto" width="128" height="128" />
</p>

<h1 align="center">Aiotto</h1>

<p align="center">
  <strong>A native desktop companion for OpenAI Codex — accounts, quota, relay routing, sessions, and local config, all in one app.</strong>
</p>

<p align="center">
  <a href="./README.md">简体中文</a> · English
</p>

<p align="center">
  <img alt="Platform" src="https://img.shields.io/badge/macOS-12%2B-black" />
  <img alt="Tauri" src="https://img.shields.io/badge/Tauri-2.x-24C8DB" />
  <img alt="Rust" src="https://img.shields.io/badge/Rust-stable-orange" />
  <img alt="License" src="https://img.shields.io/badge/License-Apache--2.0-blue" />
</p>

---

## Why Aiotto

If you live in Codex, you have probably hit these:

- **Switching accounts means hand-editing files** — flipping accounts means digging into `~/.codex/auth.json` and `config.toml`; one wrong character breaks your login.
- **Quota runs out mid-task** — when the 5-hour or weekly quota tops out, your task gets cut off and you have to manually find a free account, re-login, and restart Codex.
- **Third-party relay models are a pain to wire up** — scattered config, connectivity is a guessing game, and switching over tends to break thread continuity.
- **Local state is a mess** — accounts, sessions, MCP, Skills, routing and backups are spread across a dozen TOML / JSON / SQLite files under `~/.codex`, with no single place to see it all.
- **Usage and cost are opaque** — where did the tokens go, what was the cache hit rate, how much did this month cost?

**Built on Tauri 2 + React + Rust + a native Swift menu bar**, Aiotto folds these high-frequency tasks into one polished desktop app that reads and writes Codex data locally — fewer manual edits, fewer mistakes, fewer interruptions.

---

## Core capabilities

| Module | Pain point it solves |
| --- | --- |
| **Account management** | See quota, snapshots and login status across all accounts at a glance; switch the default account in one click — no more editing `auth.json` |
| **Auto account switch** | When quota tops out, automatically switch to an available account and gracefully restart Codex — tasks no longer stall halfway |
| **Relay management** | Provider config, balance probing, connectivity tests, config import/export and route diagnosis/repair — all in one place |
| **Smart router** | Use third-party relay models directly inside desktop Codex, while keeping historical threads resumable |
| **Session management** | Safely browse, analyze and bulk-clean local threads from a real index, with branch / project-level actions |
| **Usage statistics** | Session tokens, cache hits, request volume, source models and cost pricing — a real data-product view |
| **Menu bar** | Live account quota, provider and router status in the macOS menu bar, with light/dark adaptation |
| **MCP / Skills** | Graphically manage MCP entries and the Skills lifecycle, with backup & restore |
| **Backup center** | One-click backup/restore of key config, with manifest and file hashes; auto-snapshot before restore |
| **Maintenance tools** | One-click diagnose, repair the relay router, clean invalid data, with advanced runtime logs |
| **Settings & theming** | 4 themes × light/dark, bilingual UI, quota refresh policy, notifications and privacy options |

> **About Smart Router:** relay models are forwarded through Aiotto's local proxy; keep Aiotto running while in use.
> **Quota ≠ balance:** login-account quota and provider balance are kept separate, visually and technically.

<p align="center">
  <img src="assets/screenshot-dashboard.png" alt="Aiotto dashboard" width="1100" />
</p>

---

## Design

A polished, restrained desktop feel built for heavy daily use: a consistent type scale and spacing, restrained motion that only serves state feedback, full reduced-motion support, and **4 switchable themes** (Periwinkle / Teal / Indigo / Rose), each with light and dark variants.

---

## Platforms

| Platform | Notes |
| --- | --- |
| macOS | Apple Silicon + Intel, macOS 12+ (with a native menu bar status item) |
| Windows / Linux | Planned |

---

## Tech stack

Tauri 2 · React 19 · TypeScript · Vite · Tailwind CSS · shadcn/ui · Rust · Swift / AppKit (menu bar helper)

---

## Getting started

**Requirements:** Node.js · pnpm · Rust · [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/)

```bash
git clone https://github.com/ShawnZhuge/aiotto.git
cd aiotto
pnpm install
pnpm tauri:dev          # start the dev build
```

```bash
pnpm build                                                       # frontend build check
cargo check --manifest-path apps/desktop/src-tauri/Cargo.toml   # Rust check
pnpm tauri:build                                                # production build
```

---

## Architecture

```text
React UI ── invoke() ──▶ Tauri commands ──▶ Rust core
                                              ├── ~/.codex            (Codex native data)
                                              └── ~/.codex/.aiotto/   (Aiotto's own data)
                         Swift menu bar helper ◀── state sync (IPC)
```

---

## About this edition

This repository is the **Aiotto Community Edition**: it includes the full app shell, the UI design system, sessions, usage statistics, MCP / Skills, backup and settings. Implementations involving core strategy — auto account switch and relay / smart-router injection — are not open-sourced as part of the community edition.

---

## Community

Questions, feature requests, or just hanging out — join the **Aiotto** community group 🦦

👉 **[Get the latest WeChat group QR](https://docs.qq.com/doc/DUVdNY2trT3Nsam9B)**

---

## Contributing

Issues and pull requests are welcome. For larger changes, please open an issue first. Note that this project reads and writes local Codex data — please follow the data-safety conventions when contributing.

---

## License

[Apache License 2.0](LICENSE)

---

## Disclaimer

Aiotto is an independent local workflow tool for Codex, not affiliated with, endorsed by, or sponsored by OpenAI. Assess the risks of any third-party relay service yourself and comply with its terms.

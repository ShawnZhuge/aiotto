<p align="center">
  <img src="assets/app-icon.png" alt="Aiotto" width="128" height="128" />
</p>

<h1 align="center">Aiotto</h1>

<p align="center">
  <strong>A native desktop workbench for OpenAI Codex accounts, quota, relay routing, sessions, usage, and local configuration.</strong>
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

## Get Aiotto

Most users should download the latest macOS installer from [GitHub Releases](https://github.com/ShawnZhuge/aiotto/releases). Release builds provide the complete product experience.

This repository also provides a buildable community shell generated from a strict allowlist for reviewing and improving the public interface. The complete product experience is distributed through GitHub Releases.

---

## Why Aiotto

Long-running Codex work usually creates the same operational pain: account state is hard to see, quota usage is opaque, model-service configuration is scattered, historical sessions are hard to organize, and local configuration changes need safer backups. Aiotto brings these daily workflows into one desktop app so you spend less time switching, checking, and repairing local state.

---

## Full Product Capabilities

| Module | What it helps with |
| --- | --- |
| **Account Management** | Review account state, quota, snapshots, and login status in one place |
| **Auto Account Switch** | Move to an available account and recover the workflow when quota or account state requires it |
| **Relay Management** | Manage third-party model-service configuration, connectivity, balance, and availability |
| **Smart Routing** | Use different model services more smoothly inside Codex workflows |
| **Session Management** | Browse, search, analyze, and organize local Codex sessions |
| **Usage Statistics** | Review requests, tokens, cache hits, models, and cost trends |
| **Status Bar** | Check key status and common actions from the macOS status bar |
| **MCP / Skills** | Inspect local extension entries, health state, and basic metadata |
| **Backup Center** | Create, review, and restore backups for important local configuration |
| **Runtime Diagnostics** | Check Codex CLI, directory state, local dependencies, and runtime health |
| **Settings & Appearance** | Manage theme, language, notifications, updates, and interface preferences |

<p align="center">
  <img src="assets/screenshot-dashboard.png" alt="Aiotto dashboard" width="1100" />
</p>

---

## Platforms

| Platform | Notes |
| --- | --- |
| macOS | Apple Silicon + Intel, macOS 12+ |
| Windows / Linux | Not available |

---

## Community Source

The community shell includes the dashboard, session examples, backup examples, and device-local appearance settings. It uses public sample data and does not read or modify local product state.

```bash
git clone https://github.com/ShawnZhuge/aiotto.git
cd aiotto
pnpm install
pnpm dev
```

Build the desktop shell:

```bash
pnpm build
cargo check --locked --manifest-path src-tauri/Cargo.toml
pnpm tauri:build
```

Project structure:

```text
src/          React community interface
src-tauri/    Minimal Tauri shell with no product commands
assets/       Public brand and product imagery
```

---

## Community Feedback

Issues are welcome for product feedback, bug reports, and feature requests. To protect your privacy, do not upload account details, keys, tokens, or logs and screenshots containing personal data.

---

## License

[Apache License 2.0](LICENSE)

---

## Disclaimer

Aiotto is an independent local workflow tool for Codex, not affiliated with, endorsed by, or sponsored by OpenAI. When using third-party services, assess the risks yourself and follow their terms.

<p align="center">
  <img src="assets/app-icon.png" alt="Aiotto" width="128" height="128" />
</p>

<h1 align="center">Aiotto</h1>

<p align="center">
  <strong>An all-in-one native desktop workbench for OpenAI Codex</strong>
</p>

<p align="center">
  Manage accounts and quota, relay services and smart routing, sessions, usage, extensions, and desktop status in one place.
</p>

<p align="center">
  <a href="./README.md">简体中文</a> · English
</p>

<p align="center">
  <a href="https://github.com/ShawnZhuge/aiotto/releases/latest"><img alt="Release" src="https://img.shields.io/github/v/release/ShawnZhuge/aiotto?display_name=tag&label=Release" /></a>
  <a href="https://github.com/ShawnZhuge/aiotto/releases"><img alt="Downloads" src="https://img.shields.io/github/downloads/ShawnZhuge/aiotto/total?label=Downloads" /></a>
  <img alt="Platform" src="https://img.shields.io/badge/macOS-12%2B-black" />
  <img alt="Tauri" src="https://img.shields.io/badge/Tauri-2.x-24C8DB" />
  <img alt="License" src="https://img.shields.io/badge/License-Apache--2.0-blue" />
</p>

<p align="center">
  <a href="https://github.com/ShawnZhuge/aiotto/releases/latest"><strong>Download the latest release</strong></a>
  ·
  <a href="https://github.com/ShawnZhuge/aiotto/issues">Send feedback</a>
</p>

<p align="center">
  <img src="assets/screenshot-dashboard.png" alt="Aiotto dashboard" width="1100" />
</p>

---

## Why Aiotto

As your Codex workflow grows, account state, quota windows, model services, historical sessions, and local configuration become increasingly scattered. Routine work starts to involve switching between multiple screens, files, and tools, making it easier to miss a backup or change the wrong setting.

Aiotto brings these daily workflows into one macOS desktop app. Important state stays visible, higher-risk actions include confirmation and recovery guidance, and common actions remain available from the status bar.

## Full product capabilities

### Accounts and quota

- Review multiple Codex accounts, subscriptions, credential health, five-hour quota, and weekly quota in one place.
- Save, import, export, and organize local account snapshots, then switch accounts with confirmation and workflow recovery.
- Use quota refresh, threshold alerts, managed account switching, and five-hour quota schedules to reduce manual recovery after quota exhaustion.

### Relay services and smart routing

- Manage OpenAI-compatible and Anthropic-compatible model services with models, balance, latency, and availability in one view.
- Add, edit, delete, import, and export relay configurations, with model discovery, connectivity tests, and diagnostic results.
- Use Codex Smart Routing to choose between official and relay models, with API login mode, image-tool compatibility, and request-log export.

### Sessions, storage, and usage

- Browse, search, filter, pin, and continue local Codex sessions, with archive, trash, restore, and export actions.
- Review requests, input and output tokens, cache reads and writes, model sources, and cost trends across official and relay usage.
- Understand local storage and session-file usage, preview safe cleanup recommendations, and reduce accidental deletion through backups and post-action verification.

### Status bar and messages

- Check the current account, quota, provider balance, router state, and recent sessions from the macOS status bar.
- Customize modules, ordering, appearance, privacy mode, click behavior, and Hotspot, with launch-at-login support.
- Follow OpenAI, ChatGPT, and Codex service health and incidents, with in-app alerts, macOS notifications, messages, and announcements.
- Access project-support information through the sponsorship entry.

### Extensions, maintenance, and settings

- Inspect Codex Skills and MCP configuration sources, status, metadata, and health information.
- Review backup history, restore entry points, and export locations; run system diagnostics, safe cleanup, and common repairs from the maintenance tools.
- Manage theme, language, launch at login, account networking, refresh frequency, notifications and motion, privacy preferences, and automatic updates.

## Download and install

### Requirements

- macOS 12 Monterey or later
- Apple Silicon and Intel Macs
- Universal installer

### Installation

1. Open the [latest release](https://github.com/ShawnZhuge/aiotto/releases/latest).
2. Download the installer whose filename ends in `_universal.dmg`.
3. Open the DMG and drag Aiotto into Applications.

The current installer is not yet signed or notarized with an Apple Developer ID. On first launch, right-click Aiotto in Finder and choose **Open**. If macOS still reports that the app is damaged, first verify that the installer came from the official project release, then run:

```bash
xattr -cr /Applications/Aiotto.app
```

## Version support

Aiotto is currently in the fast-moving `0.x` stage and only the latest release is maintained. If you encounter a problem, upgrade to the [latest version](https://github.com/ShawnZhuge/aiotto/releases/latest) before reporting it.

Each stable release provides:

- A macOS DMG installer
- Files required by in-app automatic updates
- Release notes and upgrade guidance

## Community source

This project provides a separately buildable community desktop application for exploring the product interface, learning desktop application structure, and contributing improvements. Most users should install Aiotto from GitHub Releases.

### Run locally

```bash
git clone https://github.com/ShawnZhuge/aiotto.git
cd aiotto
pnpm install
pnpm dev
```

### Build checks

```bash
pnpm build
cargo check --locked --manifest-path src-tauri/Cargo.toml
pnpm tauri:build
```

### Project structure

```text
src/          React community interface
src-tauri/    Tauri desktop application
assets/       Brand and product imagery
```

## Security and privacy

- Do not upload account credentials, API keys, tokens, or other personal information in issues, screenshots, or logs.
- Before switching accounts, changing configuration, restoring data, or running cleanup, review the affected scope and backup status shown by the app.
- When using third-party model services, review their pricing, data-handling policies, and terms of service.

## Feedback and contributions

Use [GitHub Issues](https://github.com/ShawnZhuge/aiotto/issues) for bug reports, feature requests, and product feedback. Helpful reports include:

- macOS version and Mac chip type
- Aiotto version
- Reproduction steps and redacted error details

## License

[Apache License 2.0](LICENSE)

## Disclaimer

Aiotto is an independent local workflow tool for Codex and is not affiliated with, endorsed by, or sponsored by OpenAI. When using third-party services, evaluate the risks and follow their terms.

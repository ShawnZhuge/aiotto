<p align="center">
  <img src="assets/app-icon.png" alt="Aiotto" width="112" height="112" />
</p>

<h1 align="center">Aiotto</h1>

<p align="center">
  <strong>One desktop workbench for your Codex accounts, models, sessions, and local state.</strong>
</p>

<p align="center">
  <a href="./README.md">简体中文</a> · English
</p>

<p align="center">
  <a href="https://github.com/ShawnZhuge/aiotto/releases/latest"><img alt="Release" src="https://img.shields.io/github/v/release/ShawnZhuge/aiotto?display_name=tag&label=Release" /></a>
  <a href="https://github.com/ShawnZhuge/aiotto/releases"><img alt="Downloads" src="https://img.shields.io/github/downloads/ShawnZhuge/aiotto/total?label=Downloads" /></a>
  <img alt="Platform" src="https://img.shields.io/badge/macOS-12%2B-black" />
  <img alt="Platform" src="https://img.shields.io/badge/Windows-10%2F11_x64-0078D4" />
  <img alt="Tauri" src="https://img.shields.io/badge/Tauri-2.x-24C8DB" />
  <img alt="License" src="https://img.shields.io/badge/License-Apache--2.0-blue" />
</p>

<p align="center">
  <a href="https://github.com/ShawnZhuge/aiotto/releases/latest"><strong>Download the latest release</strong></a>
  ·
  <a href="https://github.com/ShawnZhuge/aiotto/issues">Report an issue</a>
  ·
  <a href="#run-from-source">Run from source</a>
</p>

<p align="center">
  <img src="assets/readme-hero-v2.png" alt="Aiotto brand visual for accounts, routing, sessions, and usage" width="1200" />
</p>

## Why Aiotto

After using Codex for a while, the model is rarely the only thing you need to manage. Account quota, model services, session history, disk usage, and extensions live in different places, so a failed task can turn into a long search for the actual cause.

Aiotto brings that state into one desktop app. It helps you understand what is happening before you switch, clean, or restore anything, then shows the result after the action.

<table>
  <tr>
    <td width="50%"><strong>Quota runs out mid-task</strong><br />Compare five-hour and weekly quota, set alerts and schedules, and switch to an available account when needed.</td>
    <td width="50%"><strong>A model service is configured but unverified</strong><br />Check models, balance, and latency; test connectivity before enabling Smart Routing.</td>
  </tr>
  <tr>
    <td><strong>Session history keeps growing</strong><br />Search, continue, archive, and restore sessions, then use real storage data to decide what should be cleaned.</td>
    <td><strong>Token usage is hard to explain</strong><br />Review requests, cache activity, tokens, and cost by time range, model, and source.</td>
  </tr>
  <tr>
    <td colspan="2"><strong>Configuration changes feel risky</strong><br />Backups, restore previews, read-only diagnostics, and follow-up checks reduce the risk of switching accounts, changing settings, or cleaning data.</td>
  </tr>
</table>

<details>
<summary><strong>Open the detailed problem-and-solution notes</strong></summary>

### 1. Several accounts have quota, but work still stops unexpectedly

Five-hour and weekly windows reset on different schedules, while every account has its own subscription and login state. Aiotto puts them on one page, adds threshold alerts and quota schedules, explains the impact before a switch, and refreshes the result afterward.

### 2. Model-service errors appear only after a real task starts

An endpoint, key, protocol, or model-name mismatch can break a request. Aiotto can discover models, check balance and latency, test connectivity, and explain common errors before Smart Routing is enabled. There is also a clear disable path when the service is no longer needed.

### 3. Sessions become hard to find, read, and clean safely

Aiotto can search, filter, pin, and continue sessions, with a table of contents and clearer roles for long conversations. Storage actions start with real usage and cleanup candidates, while archive, trash, restore, and export remain explicit choices.

### 4. Heavy usage does not explain where tokens and cost went

Usage statistics place input, output, cache activity, requests, model source, and cost on the same timeline, with official and relay traffic separated. The OpenAI status page tracks external incidents so they are not mistaken for local configuration problems.

### 5. Scattered settings make every change feel difficult to undo

Accounts, model services, Skills, MCP, and maintenance touch different state. Aiotto provides backup history, restore previews, and read-only diagnostics, then asks for scope confirmation before changes and checks the result afterward.

</details>

## See today's Codex state in one place

<p align="center">
  <img src="assets/screenshot-dashboard.png" alt="Aiotto dashboard" width="1100" />
</p>

<p align="center"><sub>Accounts, quota, requests, sessions, storage, and trends in one dashboard. The screenshot uses demo data.</sub></p>

## Core capabilities

| What you need to handle | What Aiotto provides |
| --- | --- |
| Accounts and quota | Account snapshots, subscription and credential health, quota comparison, alerts, and quota schedules |
| Models and routing | Compatible model services, model discovery, balance and latency checks, connectivity tests, and Smart Routing |
| Sessions and storage | Search, continue, pin, archive, trash, restore, export, storage analysis, and cleanup guidance |
| Usage and service status | Requests, tokens, cache activity, model source, cost, and OpenAI, ChatGPT, and Codex service health |
| macOS status bar | Account quota, model service state, recent sessions, service status, and quick navigation without opening the main window |
| Extensions and maintenance | Skills, MCP, backups, diagnostics, safe cleanup, update checks, and common recovery actions |

## Three everyday workflows

1. **Quota handoff:** review quota → set an alert or schedule → choose an available account → confirm and switch.
2. **Add a model service:** add the service → discover models → test connectivity and balance → enable routing; disable it when no longer needed.
3. **Organize sessions:** find old work → review storage → preview cleanup scope → back up, process, and rescan.

<details>
<summary><strong>Open the complete feature list</strong></summary>

### Accounts and quota

- Review account identity, subscription, active-login state, credential health, and recent refresh results.
- Track five-hour and weekly quota, reset times, and reset-credit status.
- Save, import, export, sort, remove, and switch account snapshots.
- Configure quota thresholds, refresh intervals, switching policy, and five-hour quota schedules.
- Use guided logout, login recovery, and post-switch confirmation without submitting passwords or verification codes to Aiotto.

### Relay management and Smart Routing

- Manage OpenAI-compatible and Anthropic-compatible model services.
- Discover and select models; review balance, latency, protocol, network mode, and enabled state.
- Test connectivity, understand common errors, and import, export, or preview configurations.
- Move between official and relay models, with a clear path back to the official workflow.
- Configure model labels, API login mode, and image-tool compatibility.

### Sessions, storage, and backups

- Search, filter, pin, continue, archive, trash, restore, and export local sessions.
- Use a table of contents for long sessions, clearer message roles, and responsive reading layouts.
- Review local Codex storage, session usage, and cleanup candidates.
- Active, pinned, running, and recently updated sessions are not offered as direct cleanup candidates.
- Review backup history, restore previews, and export locations; protect current state before restore and verify afterward.

### Usage, status, and alerts

- Review requests, input and output tokens, cache activity, cost, and model source across time ranges.
- Separate official and relay usage to understand where most consumption came from.
- Track OpenAI, ChatGPT, and Codex service health, incident progress, and recovery.
- Use in-app alerts, macOS notifications, messages, and announcements.
- Show account quota, relay balance, Smart Routing, recent sessions, and common actions in the status bar.

### Skills, MCP, maintenance, and settings

- Review Skills and MCP sources, state, metadata, and health results.
- Run system diagnostics, safe cleanup, Codex process actions, and common recovery tools.
- Use system, light, or dark appearance, multiple accents, and Chinese or English UI.
- Configure launch at login, window behavior, account networking, refresh intervals, notification motion, and privacy options.
- Check and install updates, then access feedback, announcements, and project-support entry points.

</details>

## Download and install

Aiotto currently supports macOS 12 Monterey or later and Windows 10/11 x64.

1. Open the [latest release](https://github.com/ShawnZhuge/aiotto/releases/latest).
2. On macOS, download the installer whose filename ends in `_universal.dmg`, open it, and drag Aiotto into Applications.
3. On Windows, download the installer whose filename ends in `Windows-x64-Setup.exe` and follow the installer.

<details>
<summary><strong>macOS says the app cannot be verified or is damaged</strong></summary>

A system security prompt may appear the first time you open Aiotto. First verify that the file came from this project's GitHub Release, then right-click Aiotto in Finder and choose **Open**. If macOS still blocks it, run:

```bash
xattr -cr /Applications/Aiotto.app
```

</details>

<details>
<summary><strong>Windows shows a security prompt on first launch</strong></summary>

A system security prompt may appear the first time you open Aiotto. First verify that the file came from this project's GitHub Release. If Windows blocks it, open **More info**, confirm the application name, and choose to continue.

</details>

## Frequently asked questions

<details>
<summary><strong>Does Aiotto log in to Codex for me?</strong></summary>

No. Complete the normal Codex login flow first, then let Aiotto save the account state. Aiotto does not ask you to submit passwords, verification codes, or cookies.

</details>

<details>
<summary><strong>Can I return to official models after using a relay?</strong></summary>

Yes. Smart Routing has explicit enable and disable flows. Disabling it returns to the official workflow. Review the impact shown by the confirmation screen before switching.

</details>

<details>
<summary><strong>Why does Aiotto keep running after I close the window?</strong></summary>

Quota alerts and Smart Routing need to remain available in the background. Closing the window only hides the main interface; use **Quit Aiotto** from the macOS status bar or Windows system tray. On macOS, you can also press `Command + Q`.

</details>

<details>
<summary><strong>Which desktop systems are supported?</strong></summary>

Aiotto currently provides a Universal installer for macOS 12+ and an x64 installer for Windows 10/11. Linux packages are not currently available.

</details>

## Run from source

Most users should install a Release. To inspect the interface or contribute a change, run it locally:

```bash
git clone https://github.com/ShawnZhuge/aiotto.git
cd aiotto
pnpm install
pnpm dev
```

<details>
<summary><strong>Build checks</strong></summary>

```bash
pnpm build
cargo check --locked --manifest-path src-tauri/Cargo.toml
pnpm tauri:build
```

</details>

## Security and privacy

- Never post account credentials, API keys, tokens, or personal information in issues, screenshots, or logs.
- Before switching accounts, changing configuration, restoring data, or cleaning files, review the impact and backup state shown in the app.
- When using a third-party model service, review its billing, data-processing policy, and terms.

## Feedback and license

Use [GitHub Issues](https://github.com/ShawnZhuge/aiotto/issues) for bugs and feature requests. The project is licensed under the [Apache License 2.0](LICENSE).

Aiotto is an independent local workflow tool for Codex and is not affiliated with, endorsed by, or sponsored by OpenAI.

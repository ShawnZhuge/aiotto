<p align="center">
  <img src="assets/app-icon.png" alt="Aiotto" width="128" height="128" />
</p>

<h1 align="center">Aiotto</h1>

<p align="center">
  <strong>An all-in-one native desktop workbench for OpenAI Codex</strong>
</p>

<p align="center">
  Understand accounts and quota, manage relay services and sessions, and turn risky local maintenance into clear, recoverable workflows.
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
  <a href="https://github.com/ShawnZhuge/aiotto/releases/tag/v0.1.4">Release notes</a>
  ·
  <a href="https://github.com/ShawnZhuge/aiotto/issues">Send feedback</a>
</p>

<p align="center">
  <img src="assets/screenshot-dashboard.png" alt="Aiotto dashboard" width="1100" />
</p>

---

## What is Aiotto?

Codex focuses on completing tasks. Over time, however, everyday maintenance spreads across accounts, quota windows, model services, session history, local storage, and extensions. Users often know that something is wrong without knowing what to check first, what a change will affect, or how to recover if it fails.

Aiotto is a local workbench for Codex desktop users. It brings frequently needed state into one place, turns repeated actions into understandable workflows, and adds confirmation, backup, and post-action verification around higher-risk operations such as account switching, configuration changes, session cleanup, and data recovery.

Aiotto is especially useful for people who:

- Use multiple Codex accounts and need to track five-hour and weekly quota.
- Want to move between official models and third-party model services.
- Have a large session history that needs searching, organizing, recovery, and storage control.
- Use Skills and MCP and want a quick view of local extension health.
- Want important state available from the macOS status bar without keeping the main window open.

## Problems Aiotto solves

### 1. The hard part of multiple accounts is knowing which one is usable now

**Common pain points**

- Five-hour and weekly quota are easy to miss until a task is interrupted.
- Subscription, credential health, reset time, and active-login state are difficult to compare across accounts.
- Manual account switching is easy to perform without a backup or reliable confirmation.

**How Aiotto helps**

- Shows account state, subscription, quota windows, reset times, and health guidance together.
- Saves, imports, exports, and organizes account snapshots, with clear impact confirmation before switching.
- Provides quota threshold alerts, optional managed switching, and five-hour quota schedules.
- Refreshes workbench state after a switch and reports whether it succeeded, failed, or requires a new login.

### 2. A third-party model being available does not make its configuration reliable

**Common pain points**

- A mismatch in Base URL, API key, protocol, or model name can produce errors that are difficult to interpret.
- Connectivity, model availability, and balance are often unknown until a real task fails.
- Users want third-party models without losing official account capabilities, session continuity, or a path back to the original state.

**How Aiotto helps**

- Manages OpenAI-compatible and Anthropic-compatible services, models, balance, latency, and enabled state in one place.
- Provides model discovery, connectivity tests, time-to-first-response feedback, network modes, error guidance, and request-log export.
- Supports adding, editing, deleting, importing, and exporting relay configurations, with import preview before changes are applied.
- Uses Codex Smart Routing to choose between official and relay models and provides a clear way back to the official workflow.
- Offers an image-tool compatibility option for services that do not support image-generation tools.

### 3. As session history grows, finding, continuing, and cleaning it safely becomes harder

**Common pain points**

- A large native session list makes a specific task difficult to find.
- Long sessions may open at the wrong reading position, while user, assistant, and internal records are hard to distinguish.
- Sessions, archives, and temporary data consume storage, but direct deletion risks losing valuable work.

**How Aiotto helps**

- Browses, searches, filters, pins, and continues local Codex sessions.
- Adds clearer message roles, a long-session table of contents, and responsive reading layouts.
- Supports archive, trash, restore, and export actions with confirmation and recovery paths.
- Shows local storage composition and cleanup recommendations, then rescans after cleanup to verify the result.

### 4. Without usage visibility, it is difficult to explain where time and money went

**Common pain points**

- A completed task does not explain how much input, output, cache, and cost it used.
- Official and relay requests are mixed together, hiding which model or service consumed more.
- Model-price changes make historical and current cost harder to compare.

**How Aiotto helps**

- Summarizes requests, input and output tokens, cache activity, model source, and cost trends.
- Separates official and relay usage and supports filtering by time range, model, and source.
- Provides model pricing and cost calculations so quota and spending changes are easier to understand.

### 5. The real risk is not having many settings; it is being unable to recover after changing them

**Common pain points**

- Skills, MCP, account settings, and model-service configuration are scattered, making the source of a failure unclear.
- Cleanup, repair, account switching, and recovery can all change local state.
- When Codex or OpenAI has an incident, it can be hard to tell whether the problem is local, account-related, or external.

**How Aiotto helps**

- Inventories Skills and MCP sources, status, metadata, and health information.
- Provides backup history, restore entry points, and export locations.
- Runs read-only diagnostics first, then offers targeted actions for confirmed problems; changes include impact confirmation and follow-up verification.
- Shows OpenAI, ChatGPT, and Codex service health and incident progress separately from local diagnostics.

## Core capabilities

### Accounts and quota

- Multi-account state, subscriptions, credential health, and active account in one view.
- Five-hour quota, weekly quota, reset times, and reset-credit status.
- Save the current login; import, export, remove, and switch account snapshots.
- Refresh frequency, threshold alerts, managed switching, and five-hour quota schedules.
- Guided logout and login recovery; Aiotto does not ask users to submit account passwords or verification codes.

### Relay management and Smart Routing

- Manage OpenAI-compatible and Anthropic-compatible services.
- Discover and select models; review balance, latency, protocol, network mode, and availability.
- Connectivity tests, error guidance, request-log export, and configuration import/export.
- Move between official and relay models with a clear path back to the official workflow.
- API login mode, model display labels, and image-tool compatibility.

### Sessions, storage, and backups

- Search, filter, pin, continue, archive, trash, restore, and export sessions.
- Long-session table of contents, clearer user/assistant roles, and responsive reading layouts.
- Local storage dashboard, session-usage analysis, and safe cleanup recommendations.
- Backup history, restore preview, pre-restore protection, and result verification.

### Usage and service status

- Requests, tokens, cache activity, model source, and cost trends.
- Official and relay source filters across multiple time ranges.
- OpenAI service health, incident progress, and recovery alerts.
- In-app notifications, macOS notifications, messages, and announcements.

### macOS status bar

- Check the current account, quota, relay state, local storage, and OpenAI service health without opening the main window.
- Configure visible content, ordering, appearance, color, privacy mode, and click behavior.
- Quick actions for refresh, settings, about, and quit.
- Background launch at login; closing the main window keeps required background capabilities available.

### Extensions, maintenance, and settings

- Skills and MCP inventory and health information.
- System diagnostics, safe cleanup, Codex process handling, and common recovery actions.
- Follow-system, light, and dark appearance with multiple accent themes.
- Language, launch at login, account networking, refresh frequency, notification motion, and update checks.
- Messages, announcements, and project-support entry points.

## Typical workflows

### Hand off work between accounts

1. Save accounts that have already completed the normal Codex login flow.
2. Review five-hour and weekly quota for each account.
3. Configure threshold alerts or optionally enable managed switching.
4. Choose an available account when quota is low, confirm the impact, and return to work.

### Add and verify a model service

1. Add the service name, endpoint, and your API key.
2. Discover models and select the ones you need.
3. Run a connectivity test to verify authentication, protocol, network, and first response.
4. Enable Smart Routing and choose the model in Codex; disable it when you want to return to the official workflow.

### Organize sessions and reclaim space

1. Find work that should be kept, archived, or restored.
2. Review the real storage used by local data.
3. Preview cleanup recommendations and confirm scope and backup state.
4. Rescan after the action to verify reclaimed space and remaining items.

### Daily status checks

1. Use the status bar to review account quota, relay state, and OpenAI service health.
2. Open the relevant page when a quota or incident notification arrives.
3. Open the full workbench for deeper actions; closing its window does not interrupt background state maintenance.

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

## Frequently asked questions

### Does Aiotto log in to Codex for me?

No. Complete the normal Codex login flow first, then let Aiotto save the current account state. Aiotto does not ask you to submit account passwords, verification codes, or cookies.

### Can I return to official models after using a relay model?

Yes. Smart Routing has explicit enable and disable flows. Disabling it returns to the official workflow. Review the impact shown in the confirmation dialog before switching.

### Why is Aiotto still running after I close the window?

The status bar, quota alerts, and Smart Routing require background availability. Closing the window hides it; use **Quit Aiotto** from the status bar or press `Command + Q` to exit completely.

### Is Windows or Linux supported?

Not currently. Aiotto currently provides a Universal installer for macOS 12 and later.

### What information should I include in a bug report?

Include the macOS version, Mac chip type, Aiotto version, reproduction steps, and redacted error details. Never upload account credentials, API keys, tokens, or screenshots and logs containing personal data.

## Version support

Aiotto is currently in the fast-moving `0.x` stage and only the latest release is maintained. Upgrade to the [latest version](https://github.com/ShawnZhuge/aiotto/releases/latest) before reporting a problem.

Each stable release provides a macOS DMG, in-app update files, release notes, and upgrade guidance.

## Run from source

This project provides a separately buildable desktop application for exploring the product interface, learning desktop application structure, and contributing improvements. Most users should install Aiotto from GitHub Releases.

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
src/          React interface
src-tauri/    Tauri desktop application
assets/       Brand and product imagery
```

## Security and privacy

- Do not upload account credentials, API keys, tokens, or other personal information in issues, screenshots, or logs.
- Before switching accounts, changing configuration, restoring data, or running cleanup, review the affected scope and backup state shown by the app.
- When using third-party model services, review their pricing, data-handling policies, and terms of service.
- Diagnostics should stay redacted. Never provide complete credentials to anyone who asks for them while troubleshooting.

## Feedback and contributions

Use [GitHub Issues](https://github.com/ShawnZhuge/aiotto/issues) for bug reports, feature requests, and product feedback. For larger changes, open an issue first and describe the scenario, expected result, and affected scope.

## License

[Apache License 2.0](LICENSE)

## Disclaimer

Aiotto is an independent local workflow tool for Codex and is not affiliated with, endorsed by, or sponsored by OpenAI. When using third-party services, evaluate the risks and follow their terms.

<p align="center">
  <img src="assets/app-icon.png" alt="Aiotto" width="112" height="112" />
</p>

<h1 align="center">Aiotto</h1>

<p align="center">
  <strong>Account and multi-relay management for Codex</strong>
</p>

<p align="center">
  See quota in one place, switch accounts quickly, and keep official models and relay models that use different protocols in the same list.
</p>

<p align="center">
  <a href="./README.md">简体中文</a> · English
</p>

<p align="center">
  <a href="https://github.com/ShawnZhuge/aiotto/releases/latest"><img alt="Release" src="https://img.shields.io/github/v/release/ShawnZhuge/aiotto?display_name=tag&label=Release" /></a>
  <a href="https://github.com/ShawnZhuge/aiotto/releases"><img alt="Downloads" src="https://img.shields.io/github/downloads/ShawnZhuge/aiotto/total?label=Downloads" /></a>
  <img alt="Platform" src="https://img.shields.io/badge/macOS-12%2B-black" />
  <img alt="Platform" src="https://img.shields.io/badge/Windows-10%2F11_x64-0078D4" />
  <img alt="License" src="https://img.shields.io/badge/License-Apache--2.0-blue" />
</p>

<p align="center">
  <a href="https://github.com/ShawnZhuge/aiotto/releases/latest"><strong>Download the latest release</strong></a>
  ·
  <a href="https://github.com/ShawnZhuge/aiotto/issues">Report an issue</a>
</p>

## Feature overview

| Feature | What it gives you |
| --- | --- |
| Account management | Save an account snapshot once; compare five-hour, weekly, or monthly quota with exact reset times and countdowns, then switch accounts with one click |
| Quota alerts | Set an alert by remaining-quota percentage and get a reminder when it is time to switch |
| Multi-relay aggregation | Manage several relays and their models together; with a ChatGPT account, official and relay models appear in the same Codex model list |
| Mixed-model sessions | Continue an existing session across official, relay Codex, Claude, and other compatible models while preserving the visible conversation context |
| No-account mode | Use configured relay models even when you do not have a ChatGPT account |
| Mobile remote use | Configure the relay on your computer once; when remotely controlling that computer's Codex session from the same ChatGPT account on your phone, relay models remain selectable |
| Quota warm-up | Schedule and test warm-up plans, review conflicts, the next run, and recent results, and align the quota window with your working hours |
| macOS menu bar | Check account quota, reset countdowns, recent sessions, and each relay's state, protocol, network mode, and latency without opening the main window |
| Sessions and usage | Manage history and filter request-level tokens, cache, latency, and estimated cost by official or relay source, model, and date |
| Storage and diagnostics | Find large files through a treemap and ranking, clean them safely, and diagnose account, relay, and runtime issues before requesting support |
| Other tools | Review OpenAI service status, Skills, MCP, application updates, and common maintenance actions |

## The problems Aiotto focuses on

### 1. Multiple accounts make quota hard to see and switching slow

Five-hour, weekly, or monthly quota and reset times differ across accounts. Checking each account separately takes time, and it is easy to start work on an account that is already close to its limit.

Aiotto puts those accounts on one page:

- Complete account setup once and save a reusable snapshot.
- See the plan, login state, available quota, exact reset time, and live countdown on each card.
- Click an account card to switch, or move quickly to the next available account.
- Set a remaining-quota percentage and get a reminder when it is time to switch.

<p align="center">
  <img src="assets/readme-accounts.png" alt="Aiotto account management with quota and quick account switching" width="1100" />
</p>

<p align="center"><sub>Account identifiers are masked. Quota, state, and switching controls use the real interface layout.</sub></p>

### 2. Relays should not require constant reconfiguration when models change

Many tools keep one current relay configuration. Moving to another relay or model means editing the endpoint, model, or protocol again. Once several relays and models are involved, maintaining the configuration becomes its own task.

Aiotto aggregates them:

- With a ChatGPT account, official models and several relay models share one model list.
- Without a ChatGPT account, no-account mode lets you work directly through a configured relay model.
- One relay can contain several models, with GPT, OpenAI-compatible, or Claude protocols selected per model instead of duplicating the relay endpoint.
- When an existing session moves among official, relay Codex, Claude, and other compatible models, Aiotto handles incompatible state while preserving the visible conversation context.
- If the selected target is unavailable, Aiotto identifies the relay, model, and reason instead of silently moving the request to an official model or another relay.

When you select an official model, official capabilities remain available according to the current account's entitlement and official service status. Before saving a relay, you can fetch its models and run a real streaming test; after adding it, you can review balance, latency, protocol, and network mode.

<p align="center">
  <img src="assets/readme-relays.png" alt="Aiotto relay management with model counts, protocols, connection state, and latency" width="1100" />
</p>

<p align="center"><sub>Manage several relays together and review model counts, protocols, connection state, and latency.</sub></p>

<p align="center">
  <img src="assets/readme-model-routing.png" alt="Switching among official GPT, relay Claude, and relay GPT models in one Codex session" width="1100" />
</p>

<p align="center"><sub>One Codex session uses official GPT, relay Claude, and relay GPT in sequence, while official and relay models remain available in the same list.</sub></p>

| Situation | How selection works |
| --- | --- |
| You have a ChatGPT account | Official models, Relay A, Relay B, and others appear together in the Codex model list |
| You do not have a ChatGPT account | Enable no-account mode and select a relay model directly |
| You switch models in an existing session | Visible conversation context is preserved while incompatible internal state is isolated |
| You continue a computer task from your phone | Aiotto manages relays on the computer; use the same ChatGPT account to remotely control that computer's Codex session and select a relay model from the list |

There is no need to enter relay endpoints and keys again on the phone. Aiotto keeps relay management on the computer while the phone remotely controls the Codex session running there.

After Smart Routing is disabled, relay models stop immediately. Aiotto restores the native official workflow once any required session cleanup is complete.

## Other everyday problems

### The quota window is not ready when work starts

Quota warm-up can start a scheduled task in advance, bringing the five-hour window closer to your regular working hours. You can schedule several times, test a plan, review conflicts and the next run, and confirm the outcome from recent records.

### Checking quota should not require the main window

On macOS, the menu-bar view shows quota, exact reset times, live countdowns, and recent sessions for the current and other accounts. It also shows each relay's availability, protocol, network mode, and latency. Privacy mode hides sensitive details while retaining the account count, current account, and switching controls.

### Session history grows, but token usage remains unclear

Search, continue, pin, archive, restore, and export previous sessions. Filter usage by official or relay source, relay service, model, and date, then inspect each request's input, output, cache, total tokens, latency, status, and estimated cost. If a history record is anomalous, confirmed data remains visible with a clear affected range.

### Local data keeps growing, but cleaning it feels risky

An interactive treemap and session ranking show the size, share, and last update time of local Codex data. Move a session to Trash first when appropriate; permanent cleanup creates a safety backup and protects active, pinned, running, and recent sessions.

### It is hard to tell whether an issue comes from an account, relay, or Codex

Maintenance tools can check account, relay, session, and runtime state first, with safe actions for issues that can be confirmed. When more help is needed, export or send redacted diagnostics and keep the returned diagnostic ID for follow-up.

## One dashboard for the full picture

<p align="center">
  <img src="assets/readme-dashboard.png" alt="Aiotto dashboard for accounts, relays, sessions, storage, and usage" width="1100" />
</p>

<p align="center"><sub>Accounts, quota, relays, sessions, storage, tokens, and cost trends in one place. Account identifiers are masked.</sub></p>

## Download and install

Aiotto supports macOS 12 Monterey or later and Windows 10/11 x64.

### macOS

1. Open the [latest release](https://github.com/ShawnZhuge/aiotto/releases/latest).
2. Download the installer whose filename ends in `_universal.dmg`.
3. Open the DMG and drag Aiotto into Applications.

A system security prompt may appear the first time you open Aiotto. First confirm that the file came from this project's GitHub Release, then right-click Aiotto in Finder and choose **Open**. If macOS still blocks it, run:

```bash
xattr -cr /Applications/Aiotto.app
```

### Windows

1. Open the [latest release](https://github.com/ShawnZhuge/aiotto/releases/latest).
2. Download the installer whose filename ends in `Windows-x64-Setup.exe`.
3. Follow the installer prompts.

A system security prompt may appear the first time you open Aiotto. If Windows blocks it, open **More info**, confirm the application name and download source, then continue.

## Frequently asked questions

### Can I use Aiotto without a ChatGPT account?

Yes. Add an available relay in Aiotto, complete the connection test, and enable no-account mode.

### Can I keep using official models and capabilities when I have an account?

Yes. When Smart Routing is enabled, official and relay models appear together. Official capabilities remain available according to the current account's entitlement and official service status. If a selected relay is unavailable, Aiotto reports it instead of silently consuming official quota.

### Why can relay models also appear on my phone?

Aiotto manages relays on the computer. When the same ChatGPT account remotely controls that computer's Codex session from a phone, the model list includes the relay models already configured on the computer.

### Does Aiotto ask me to submit my account password?

No. Complete the normal ChatGPT or Codex login flow first, then let Aiotto save the account snapshot. Never send passwords, verification codes, or cookies to a third party.

### Why does Aiotto keep running after I close the window?

Quota alerts and routing need to remain available in the background. Closing the window hides the main interface; use **Quit Aiotto** from the macOS menu bar or Windows system tray to stop the app completely.

## Safety and feedback

- Never post account credentials, API keys, tokens, or personal information in issues, screenshots, or logs.
- Before using a third-party relay, review its pricing, data-processing policy, and terms.
- Report problems through [GitHub Issues](https://github.com/ShawnZhuge/aiotto/issues).

The project uses the [Apache License 2.0](LICENSE).

Aiotto is an independent local workflow tool for Codex and is not affiliated with, endorsed by, or sponsored by OpenAI.

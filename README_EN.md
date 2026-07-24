<p align="center">
  <img src="assets/app-icon.png" alt="Aiotto" width="112" height="112" />
</p>

<h1 align="center">Aiotto</h1>

<p align="center">
  <strong>Account and multi-relay management for Codex</strong>
</p>

<p align="center">
  See quota in one place, switch accounts quickly, and keep official and relay models in the same list.
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
| Account management | Complete setup once and save an account snapshot; compare five-hour and weekly quota, then switch to the next available account with one click |
| Quota alerts | Set an alert by remaining-quota percentage and get a reminder when it is time to switch |
| Multi-relay aggregation | Manage several relays together; with a ChatGPT account, official and relay models appear in the same Codex model list |
| No-account mode | Use configured relay models even when you do not have a ChatGPT account |
| Mobile remote use | Configure the relay on your computer once; when remotely controlling that computer's Codex session from the same ChatGPT account on your phone, relay models remain selectable |
| Quota warm-up | Schedule automatic warm-up tasks so the quota window better matches your working hours |
| macOS menu bar | Check account quota, service state, relays, and recent sessions without opening the main window |
| Sessions and usage | Review session history, tokens, cache activity, requests, and estimated cost |
| Storage and maintenance | Review local storage, backups and restores, OpenAI status, Skills, MCP, updates, and common maintenance actions |

## The problems Aiotto focuses on

### 1. Multiple accounts make quota hard to see and switching slow

Five-hour quota, weekly quota, and reset times differ across accounts. Checking each account separately takes time, and it is easy to start work on an account that is already close to its limit.

Aiotto puts those accounts on one page:

- Complete account setup once and save a reusable snapshot.
- See the plan, login state, quota, and reset time on each card.
- Click an account card to switch, or move quickly to the next available account.
- Set a remaining-quota percentage and get a reminder when it is time to switch.

<p align="center">
  <img src="assets/readme-accounts.png" alt="Aiotto account management with quota and quick account switching" width="1100" />
</p>

<p align="center"><sub>Account identifiers are masked. Quota, state, and switching controls use the real interface layout.</sub></p>

### 2. A relay should not be limited to one active configuration

Many tools keep one current relay configuration. Moving to another relay means editing the endpoint, model, or related settings again. Once several relays are involved, configuration switching becomes its own task.

Aiotto aggregates them:

- With a ChatGPT account, official models and several relay models share one model list.
- Without a ChatGPT account, no-account mode lets you work directly through a configured relay model.
- Before enabling a relay, you can review its models, balance, and latency, then run a connection test.
- When a relay is no longer needed, disable routing and return to the normal official-model workflow.

| Situation | How selection works |
| --- | --- |
| You have a ChatGPT account | Official models, Relay A, Relay B, and others appear together in the Codex model list |
| You do not have a ChatGPT account | Enable no-account mode and select a relay model directly |
| You continue a computer task from your phone | Aiotto manages relays on the computer; use the same ChatGPT account to remotely control that computer's Codex session and select a relay model from the list |

There is no need to enter relay endpoints and keys again on the phone. Aiotto keeps relay management on the computer while the phone remotely controls the Codex session running there.

## Other everyday problems

### The quota window is not ready when work starts

Quota warm-up can start a scheduled task in advance, bringing the five-hour window closer to your regular working hours. It is useful when you rely on Codex at a fixed time and do not want to wait for the window to recover.

### Checking quota should not require the main window

On macOS, the menu-bar view shows the current account, quota, reset time, relay state, service state, and recent sessions. Common actions are available there as well.

### Session history grows, but token usage remains unclear

Search, continue, pin, archive, restore, and export previous sessions. Usage statistics break down input, output, cache activity, requests, model source, and estimated cost over time.

### Local data keeps growing, but cleaning it feels risky

Aiotto shows the composition of local Codex storage and session usage, with backups, restore previews, and cleanup guidance. OpenAI status, Skills, MCP, update checks, and common maintenance actions are also available in the app.

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

### Can I keep using official models when I have an account?

Yes. When routing is enabled, official and relay models appear together. Disable routing to return to the normal official-model workflow.

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

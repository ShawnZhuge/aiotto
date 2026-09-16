<h1 align="center">Bring your usual models into Codex.</h1>

<p align="center">
  Aiotto connects model services and manages accounts alongside Codex Desktop. Use your existing Coding Plan, Token Plan, or API with adapted tools in the interface you know, and keep account quota, usage, and past sessions in one place.
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
  <a href="https://github.com/ShawnZhuge/aiotto/releases/latest"><strong>Download Aiotto</strong></a>
  ·
  <a href="#in-action">See it in action</a>
</p>

<p align="center">
  <img src="assets/readme-hero-routing.png" alt="Aiotto: bring more models into your Codex workflow" width="1100" />
</p>

<p align="center"><sub>The cover illustrates an earlier interface; see the capability tables below for model support and scope.</sub></p>

> Available for macOS and Windows. This page describes released features; see [release notes](https://github.com/ShawnZhuge/aiotto/releases) for updates. Model capabilities depend on the plan, protocol, and verified model.

[In action](#in-action) · [Features](#features) · [Accounts and testing](#accounts) · [Capabilities](#capabilities) · [Get started](#start)

<a id="in-action"></a>

## Use your model services in Codex

Already have a Coding Plan, Token Plan, or API? Add the matching provider in Aiotto and select its connected models from the Codex model list.

- **Keep official and third-party models together.** Choose a connected model for the task in front of you.
- **Switch models within the same task.** Continue with the messages and tool results that can be carried across; see the [capability tables](#capabilities) for scope.
- **Keep using adapted tools.** Read files, run commands, and edit code, with tool results returned to the conversation.

<p align="center">
  <img src="assets/readme-model-routing.png" alt="Official and third-party models in Codex, with model switching in one conversation" width="1100" />
</p>

<p align="center"><sub>Real interface example from an earlier version. Available models and menus depend on the account, provider configuration, and installed version.</sub></p>

With a ChatGPT account, use official and provider models together. Without one, use a configured provider in no-account mode. If an explicitly selected provider fails, Aiotto reports the reason without silently switching providers or spending official quota.

<a id="features"></a>

## Feature overview

If you use Codex every day, Aiotto helps with the work around it: less configuration when changing models, quota visibility before switching accounts, and usage records without digging through logs.

| Feature | What you can do |
| --- | --- |
| Model connections | **Choose official and third-party models together in Codex**; use three protocols, model search and filtering, bulk selection, and provider import/export |
| Tools and continuity | Read files, run commands, and edit code with adapted models; keep portable history and tool results when **changing models within a task** |
| No-account mode | Without a ChatGPT account, start tasks through configured provider models in no-account mode |
| Remote use from a phone | Configure providers on the computer, then use the same ChatGPT account on your phone to remotely operate that computer's Codex session and select its connected models |
| Account management | Save account snapshots and view plans, login status, and available five-hour, weekly, or monthly windows; see **remaining quota and reset countdowns** together, sort accounts, and switch with a click |
| Groups and migration | Group, filter, and organize accounts in bulk; preview and select JSON imports, skip duplicates by default, and keep the current account unchanged |
| macOS menu bar | Check account quota, reset countdowns, recent sessions, and provider status, protocols, network modes, and latency without opening the main window |
| Connection tests | Run real streaming requests to check connectivity and latency; test providers with configured models in sequence and compare that run's results |
| Pelican testing | Choose accounts, models, reasoning levels, and concurrency; watch generation, review history, cancel, retry failures, and export results |
| Usage statistics | Filter official and provider traffic by model and date; inspect tokens, cache, latency, status, and estimated cost per request. macOS also offers in-conversation token and context statistics |
| Session management | Search by content, directory, or ID; navigate long conversations with an outline, pin, continue, bulk-archive, restore, and export |
| Alerts and warm-ups | Set remaining-quota percentage thresholds for switch reminders; bind warm-up plans to accounts and models, test plans, check conflicts, and view the next run and recent results |
| Backup and cleanup | Inspect storage treemaps and large-file rankings; create and restore snapshots, with safety backups before permanent cleanup and protection for active and recent sessions |
| Status and maintenance | View OpenAI service status, check Aiotto updates and account/provider/runtime health, inspect local Skills / MCP inventories, and export or send sanitized diagnostics |

<a id="accounts"></a>

## Keep accounts easy to find and compare

See which account has quota left, when it resets, and which one to use next, all in one place.

| Your question | How Aiotto helps |
| --- | --- |
| How much quota is left? | View the account's available five-hour, weekly, or monthly quota windows with precise reset times and countdowns; set percentage thresholds for switch reminders |
| Need another account? | Save snapshots of authenticated accounts, click a card to switch, or move to the next available account |
| Too many accounts? | Filter by group and sort by quota, reset time, subscription expiry, or custom order |
| Need bulk organization? | Manage group membership in bulk; removing an account from a group does not delete it |
| Moving existing accounts? | Preview and select JSON imports, skip duplicates by default, and keep the current account unchanged |

<p align="center">
  <img src="assets/readme-accounts.png" alt="Aiotto accounts with quota, reset times, and account switching" width="1100" />
</p>

<p align="center"><sub>Earlier interface example with account identifiers masked; newer layouts, including groups, depend on the installed app.</sub></p>

Preview account JSON before selecting entries to import. Duplicates are skipped by default, and importing does not switch the current account. Supported formats include Aiotto backups and selected Codex / ChatGPT OAuth credentials from Codex, New API, Sub2API, and Cockpit Tools. Actual usability still requires successful authentication.

### 🦩 Pelican: keep the test process and results together

Choose saved ChatGPT OAuth accounts, a model, reasoning level, and concurrency. Watch generation, inspect result details, and review history. Cancel runs, retry failed items, or export results for later comparison.

Tests make real requests and consume the corresponding quota. Expired credentials need renewed authorization; results describe the tested task only.

### ⏰ Schedule warm-ups per account, then check the outcome

Bind plans to accounts, choose automatic or fixed models, and arrange group schedules. Test plans, check time conflicts, and view the next run and recent results. Execution details show before-and-after quota-window samples, distinguishing confirmed, started, and pending states.

Keep Aiotto running and the computer awake and online. **Warm-ups do not guarantee that quota refreshes, extends, or resets; the service determines window changes.**

<details>
<summary>📦 Provider management, usage, and everyday maintenance</summary>

### Find models in a large catalog

Search by name or ID, filter by namespace or selected models, and bulk-select the current results. Import and export provider settings; new imported entries stay disabled until reviewed and enabled.

Connection tests make real streaming requests. Test providers with configured models in sequence and see the fastest result in that run. Testing may consume quota. Subscription quota, API balance, and locally estimated costs remain separate.

<p align="center">
  <img src="assets/readme-relays.png" alt="Aiotto providers with models, connection status, and latency" width="1100" />
</p>

### Review usage and cache records

Filter official and provider traffic by model and date, then inspect input, output, total tokens, cache, latency, status, and estimated cost for each request. Statistics errors and quota-cache cleanup have status feedback; the provider’s bill remains authoritative.

On macOS, optionally show per-turn tokens, cache, and context usage inside Codex. Restart Codex to enable the enhancement, and restart again after disabling it to turn it off completely.

### Organize sessions and local data

Search by content, directory, or ID and use the conversation outline to navigate. Pin, continue, bulk-archive, restore, or export sessions. If archive or restore reports incomplete directory synchronization, do not repeat the operation.

Storage treemaps and rankings help locate large files. Permanent cleanup creates a safety backup and protects active, pinned, running, and recent sessions. Inspect snapshots and restore the paths they cover in the backup center.

### Check status and diagnostics

Without opening the main window, use the macOS menu bar to check current and other accounts' quota, precise reset times, countdowns, and recent sessions, plus provider status, protocols, network modes, and latency. Privacy mode hides sensitive details while keeping switching available.

Maintenance tools inspect accounts, providers, and runtime status, and can export or send sanitized diagnostics with a follow-up ID. Skills / MCP pages show local inventories, sources, configuration, and status.

The OpenAI service status page shows official service degradation, outages, and incident updates. The app update entry checks for new Aiotto releases.

</details>

<a id="capabilities"></a>

## Which models connect, and what can they do?

Aiotto supports Responses, Chat Completions, and Anthropic Messages. Choose the matching protocol, then check the model’s tool and multimodal support.

**✅ Native preservation　🔄 Working bridge　⚠️ Limited or not passed　⬜ Not confirmed　🚫 Not provided on this path**

Native connections and bridges can both complete their verified tasks; check the notes for limitations. ⚠️ and ⬜ are not support promises, and ⬜ does not mean unsupported. Choose your provider and plan, then compare its protocol and capabilities.

### Three-protocol capability overview

Responses has two paths below: the official account path and third-party connections. They use the same protocol but can expose different capabilities.

<table>
<thead>
<tr><th rowspan="2" scope="col">Capability</th><th colspan="2" scope="colgroup">Responses</th><th rowspan="2" scope="col">Chat Completions</th><th rowspan="2" scope="col">Anthropic Messages</th></tr>
<tr><th scope="col">Official account · passthrough</th><th scope="col">Third-party connection</th></tr>
</thead>
<tbody>
<tr><th scope="row">Text conversations</th><td>✅</td><td>✅</td><td>🔄</td><td>🔄</td></tr>
<tr><th scope="row">Streaming and terminal states</th><td>✅</td><td>✅</td><td>🔄</td><td>🔄</td></tr>
<tr><th scope="row">Reasoning levels</th><td>✅ Per official model</td><td>✅ / 🔄 Per model</td><td>🔄 Per model</td><td>🔄 Per model</td></tr>
<tr><th scope="row">Function calls and results</th><td>✅</td><td>✅ / 🔄 Per target</td><td>🔄</td><td>🔄</td></tr>
<tr><th scope="row">Parallel tool calls</th><td>✅ Per model</td><td>✅ / 🔄 Selected targets</td><td>🔄 Selected targets</td><td>🔄 Selected targets</td></tr>
<tr><th scope="row">Apply Patch</th><td>✅</td><td>✅ / 🔄 Selected targets</td><td>🔄 Selected targets</td><td>🔄 Selected targets</td></tr>
<tr><th scope="row">Tool groups (Namespace)</th><td>✅</td><td>✅ / 🔄 Per target</td><td>🔄</td><td>🔄</td></tr>
<tr><th scope="row">Dynamic discovery (Tool Search)</th><td>✅ Per entry point</td><td>✅ / 🔄 Selected targets</td><td>⚠️ Tool discovery varies by model</td><td>🔄 Selected targets</td></tr>
<tr><th scope="row">JSON answers</th><td>✅ Per model</td><td>✅ Verified targets</td><td>🔄 Per model</td><td>🔄 Per model</td></tr>
<tr><th scope="row">Strict structured output (JSON Schema)</th><td>✅ Per model</td><td>⚠️ Per target and entry</td><td>⚠️ Some upstreams reject it</td><td>⚠️ Per target and entry</td></tr>
<tr><th scope="row">Image understanding</th><td>✅ Per model</td><td>✅ Verified targets</td><td>🔄 Verified targets</td><td>🔄 Verified targets</td></tr>
<tr><th scope="row">Direct PDF input</th><td>✅ Per entry point</td><td>⚠️ Selected API checks</td><td>🚫 Standard direct path</td><td>⚠️ Selected bridged API checks</td></tr>
<tr><th scope="row">Web search and citations</th><td>✅ Per service</td><td>✅ / 🔄 Per search service</td><td>🔄 Per search service</td><td>🔄 Per search service</td></tr>
<tr><th scope="row">Multi-turn conversations</th><td>✅</td><td>✅ / 🔄</td><td>🔄</td><td>🔄</td></tr>
<tr><th scope="row">Visible history across models</th><td>✅ Between official models</td><td>🔄</td><td>🔄</td><td>🔄</td></tr>
<tr><th scope="row">Private reasoning and encrypted state</th><td>✅ Within the same model</td><td>⚠️ Within the tested connection</td><td>🚫 Cross-protocol transfer</td><td>⚠️ Within the tested connection</td></tr>
<tr><th scope="row">Resume after cancellation; return errors</th><td>✅</td><td>✅ / 🔄 Per target</td><td>🔄 Per target</td><td>🔄 Per target</td></tr>
<tr><th scope="row">Token / cache usage reporting</th><td>✅ Upstream-provided fields</td><td>✅ / 🔄 Upstream fields</td><td>🔄 Upstream fields</td><td>🔄 Upstream fields</td></tr>
<tr><th scope="row">Official image generation / editing entry</th><td>✅ Separate service</td><td>🚫</td><td>🚫</td><td>🚫</td></tr>
<tr><th scope="row">Official realtime voice entry</th><td>⚠️ Passthrough; service limited</td><td>🚫</td><td>🚫</td><td>🚫</td></tr>
</tbody>
</table>

The official column describes preservation of the account's native path; availability depends on entitlements, Codex entry points, and service status. Third-party columns describe adapted scopes, not every model. A correct JSON answer does not prove strict JSON Schema support, and an image attachment entry does not prove image understanding.

<details>
<summary>🛠️ Desktop tools, collaboration, and extensions</summary>

Codex or connected tools execute these capabilities. Aiotto carries calls, results, and task context. They require host entry points, permissions, and services; they are not built-in server tools of the model.

<table>
<thead>
<tr><th rowspan="2" scope="col">Capability</th><th colspan="2" scope="colgroup">Responses</th><th rowspan="2" scope="col">Chat Completions</th><th rowspan="2" scope="col">Anthropic Messages</th></tr>
<tr><th scope="col">Official account · passthrough</th><th scope="col">Third-party connection</th></tr>
</thead>
<tbody>
<tr><th scope="row">Local files, code search, and Shell</th><td>✅</td><td>✅ / 🔄</td><td>🔄</td><td>🔄</td></tr>
<tr><th scope="row">Skills and project rules</th><td>✅</td><td>✅ / 🔄 Selected targets</td><td>🔄 Selected targets</td><td>🔄 Selected targets</td></tr>
<tr><th scope="row">MCP / plugin tool calls</th><td>✅ Per connection</td><td>✅ / 🔄 Selected targets</td><td>🔄 Selected targets</td><td>🔄 Selected targets</td></tr>
<tr><th scope="row">Browser navigation, reading, and screenshots</th><td>✅ Per entry point</td><td>✅ / 🔄 Selected targets</td><td>🔄 Selected targets</td><td>🔄 Selected targets</td></tr>
<tr><th scope="row">Computer use (such as Calculator)</th><td>✅ Per entry point</td><td>✅ / 🔄 Selected targets</td><td>🔄 Selected targets</td><td>⚠️ Per target</td></tr>
<tr><th scope="row">Site tools (WebMCP)</th><td>✅ Per entry point</td><td>✅ / 🔄 Selected targets</td><td>🔄 Selected targets</td><td>⚠️ Per target</td></tr>
<tr><th scope="row">Subtask creation, waiting, and returned results</th><td>✅</td><td>🔄 Selected targets</td><td>🔄 Selected targets</td><td>🔄 Selected targets</td></tr>
<tr><th scope="row">PTY interruption and recovery</th><td>✅</td><td>✅ / 🔄 Selected targets</td><td>🔄 Selected targets</td><td>⚠️ Per target</td></tr>
<tr><th scope="row">Read-only code review</th><td>✅</td><td>✅ / 🔄 Selected targets</td><td>🔄 Selected targets</td><td>🔄 Selected targets</td></tr>
<tr><th scope="row">Goal tasks</th><td>✅ Per entry point</td><td>⚠️ Selected lifecycle checks</td><td>⚠️ Selected lifecycle checks</td><td>⚠️ Selected lifecycle checks</td></tr>
<tr><th scope="row">Automation creation and scheduled execution</th><td>✅ Per entry point</td><td>⬜ Scheduled execution unconfirmed</td><td>⚠️ Creation verified; scheduling unconfirmed</td><td>⚠️ Scheduled execution unconfirmed</td></tr>
<tr><th scope="row">Approvals, sandboxing, and rejection</th><td>✅ Per host policy</td><td>⚠️ Per tested task</td><td>⚠️ Per tested task</td><td>⚠️ Per tested task</td></tr>
<tr><th scope="row">Plan / Worktree UI entry points</th><td>✅ Per host version</td><td>⬜ No per-model promise</td><td>⬜ No per-model promise</td><td>⬜ No per-model promise</td></tr>
<tr><th scope="row">Memory / Hooks</th><td>✅ Per host configuration</td><td>⬜ No per-model promise</td><td>⬜ No per-model promise</td><td>⬜ No per-model promise</td></tr>
<tr><th scope="row">Generated files and clickable previews</th><td>✅ Per host entry</td><td>⚠️ File creation is not preview proof</td><td>⚠️ File creation is not preview proof</td><td>⚠️ File creation is not preview proof</td></tr>
<tr><th scope="row">Upstream-hosted File Search / Remote MCP / Code Execution</th><td>✅ Per official entry</td><td>⬜ Verify upstream separately</td><td>🚫 No equivalent mapping</td><td>🚫 No equivalent mapping</td></tr>
</tbody>
</table>

Local file search, connected MCP tools, Shell, and upstream-hosted services are separate paths. 🚫 does not exclude independent tools. An automation review card proves neither persistence nor scheduled execution.

</details>

### Capabilities by provider

All providers remain visible in the overview, grouped by China-based providers, US-based providers, and connection platforms. Each plan/API keeps its own row. Chat means Chat Completions; Messages means Anthropic Messages. Numbered markers have conditions in the model table below; the order is not a capability ranking.

<table id="provider-capability-matrix">
<thead><tr><th>Provider</th><th>Connection</th><th>Files</th><th>Patch</th><th>MCP</th><th>Subtasks</th><th>Images</th><th>History</th></tr></thead>
<tbody><tr><th colspan="8">China-based providers</th></tr></tbody>
<tbody>
<tr><th scope="rowgroup" rowspan="2"><strong>DeepSeek</strong></th><td>API <sup><a href="#provider-scope-1" aria-label="Verified scope 1">1</a></sup><br><sub>Chat</sub></td><td>🔄</td><td>🔄</td><td>🔄</td><td>⚠️<sup><a href="#provider-scope-1">1</a></sup></td><td>🚫<sup><a href="#provider-scope-1">1</a></sup></td><td>🔄</td></tr>
<tr><td>API <sup><a href="#provider-scope-2" aria-label="Verified scope 2">2</a></sup><br><sub>Responses</sub></td><td>🔄<sup><a href="#provider-scope-2">2</a></sup></td><td>🔄</td><td>⚠️<sup><a href="#provider-scope-2">2</a></sup></td><td>⚠️<sup><a href="#provider-scope-2">2</a></sup></td><td>🚫<sup><a href="#provider-scope-2">2</a></sup></td><td>🔄</td></tr>
</tbody>
<tbody>
<tr><th scope="rowgroup" rowspan="2"><strong>Qwen</strong></th><td>Token Plan <sup><a href="#provider-scope-3" aria-label="Verified scope 3">3</a></sup><br><sub>Responses</sub></td><td>🔄<sup><a href="#provider-scope-3">3</a></sup></td><td>🔄</td><td>⬜</td><td>⬜</td><td>✅<sup><a href="#provider-scope-3">3</a></sup></td><td>🔄<sup><a href="#provider-scope-3">3</a></sup></td></tr>
<tr><td>Third-party API <sup><a href="#provider-scope-4" aria-label="Verified scope 4">4</a></sup><br><sub>Responses</sub></td><td>⚠️<sup><a href="#provider-scope-4">4</a></sup></td><td>⚠️<sup><a href="#provider-scope-4">4</a></sup></td><td>⬜</td><td>⬜</td><td>⚠️<sup><a href="#provider-scope-4">4</a></sup></td><td>⚠️<sup><a href="#provider-scope-4">4</a></sup></td></tr>
</tbody>
<tbody>
<tr><th scope="rowgroup" rowspan="1"><strong>Zhipu</strong></th><td>Coding Plan <sup><a href="#provider-scope-5" aria-label="Verified scope 5">5</a></sup><br><sub>Responses</sub></td><td>✅</td><td>✅</td><td>✅</td><td>⚠️<sup><a href="#provider-scope-5">5</a></sup></td><td>⚠️<sup><a href="#provider-scope-5">5</a></sup></td><td>✅</td></tr>
</tbody>
<tbody>
<tr><th scope="rowgroup" rowspan="1"><strong>Moonshot</strong></th><td>API <sup><a href="#provider-scope-6" aria-label="Verified scope 6">6</a></sup><br><sub>Responses</sub></td><td>🔄</td><td>🔄</td><td>🔄</td><td>⚠️<sup><a href="#provider-scope-6">6</a></sup></td><td>✅<sup><a href="#provider-scope-6">6</a></sup></td><td>🔄</td></tr>
</tbody>
<tbody>
<tr><th scope="rowgroup" rowspan="1"><strong>Xiaomi</strong></th><td>Token Plan <sup><a href="#provider-scope-7" aria-label="Verified scope 7">7</a></sup><br><sub>Responses</sub></td><td>🔄</td><td>⬜<sup><a href="#provider-scope-7">7</a></sup></td><td>🔄</td><td>⚠️<sup><a href="#provider-scope-7">7</a></sup></td><td>⚠️<sup><a href="#provider-scope-7">7</a></sup></td><td>🔄</td></tr>
</tbody>
<tbody>
<tr><th scope="rowgroup" rowspan="1"><strong>MiniMax</strong></th><td>Token Plan <sup><a href="#provider-scope-8" aria-label="Verified scope 8">8</a></sup><br><sub>Messages</sub></td><td>🔄</td><td>🔄</td><td>🔄<sup><a href="#provider-scope-8">8</a></sup></td><td>⚠️<sup><a href="#provider-scope-8">8</a></sup></td><td>🔄<sup><a href="#provider-scope-8">8</a></sup></td><td>🔄</td></tr>
</tbody>
<tbody>
<tr><th scope="rowgroup" rowspan="1"><strong>Volcengine</strong></th><td>Coding Plan <sup><a href="#provider-scope-9" aria-label="Verified scope 9">9</a></sup><br><sub>Responses</sub></td><td>🔄</td><td>⚠️<sup><a href="#provider-scope-9">9</a></sup></td><td>🔄<sup><a href="#provider-scope-9">9</a></sup></td><td>⚠️<sup><a href="#provider-scope-9">9</a></sup></td><td>⬜<sup><a href="#provider-scope-9">9</a></sup></td><td>🔄</td></tr>
</tbody>
<tbody><tr><th colspan="8">US-based providers</th></tr></tbody>
<tbody>
<tr><th scope="rowgroup" rowspan="2"><strong>OpenAI</strong></th><td>Official account <sup><a href="#provider-scope-10" aria-label="Verified scope 10">10</a></sup><br><sub>Responses</sub></td><td>✅</td><td>✅</td><td>✅<sup><a href="#provider-scope-10">10</a></sup></td><td>✅</td><td>✅<sup><a href="#provider-scope-10">10</a></sup></td><td>✅</td></tr>
<tr><td>Third-party API <sup><a href="#provider-scope-11" aria-label="Verified scope 11">11</a></sup><br><sub>Responses</sub></td><td>✅</td><td>⬜<sup><a href="#provider-scope-11">11</a></sup></td><td>✅</td><td>⚠️<sup><a href="#provider-scope-11">11</a></sup></td><td>✅<sup><a href="#provider-scope-11">11</a></sup></td><td>✅</td></tr>
</tbody>
<tbody>
<tr><th scope="rowgroup" rowspan="1"><strong>Anthropic</strong></th><td>Third-party API <sup><a href="#provider-scope-12" aria-label="Verified scope 12">12</a></sup><br><sub>Messages</sub></td><td>🔄</td><td>🔄</td><td>⚠️<sup><a href="#provider-scope-12">12</a></sup></td><td>⚠️<sup><a href="#provider-scope-12">12</a></sup></td><td>🔄<sup><a href="#provider-scope-12">12</a></sup></td><td>🔄</td></tr>
</tbody>
<tbody>
<tr><th scope="rowgroup" rowspan="1"><strong>Google</strong></th><td>Third-party API <sup><a href="#provider-scope-13" aria-label="Verified scope 13">13</a></sup><br><sub>Messages</sub></td><td>🔄<sup><a href="#provider-scope-13">13</a></sup></td><td>⚠️<sup><a href="#provider-scope-13">13</a></sup></td><td>⚠️<sup><a href="#provider-scope-13">13</a></sup></td><td>⚠️<sup><a href="#provider-scope-13">13</a></sup></td><td>🔄<sup><a href="#provider-scope-13">13</a></sup></td><td>🔄<sup><a href="#provider-scope-13">13</a></sup></td></tr>
</tbody>
<tbody>
<tr><th scope="rowgroup" rowspan="1"><strong>xAI</strong></th><td>Third-party API <sup><a href="#provider-scope-14" aria-label="Verified scope 14">14</a></sup><br><sub>Responses</sub></td><td>✅</td><td>⚠️<sup><a href="#provider-scope-14">14</a></sup></td><td>⚠️<sup><a href="#provider-scope-14">14</a></sup></td><td>⚠️<sup><a href="#provider-scope-14">14</a></sup></td><td>✅<sup><a href="#provider-scope-14">14</a></sup></td><td>✅</td></tr>
</tbody>
<tbody><tr><th colspan="8">Connection platforms</th></tr></tbody>
<tbody>
<tr><th scope="rowgroup" rowspan="1"><strong>CommandCode</strong><br><small>Platform</small></th><td>API <sup><a href="#provider-scope-15" aria-label="Verified scope 15">15</a></sup><br><sub>Chat</sub></td><td>🔄</td><td>🔄</td><td>⬜</td><td>⬜</td><td>🔄<sup><a href="#provider-scope-15">15</a></sup></td><td>🔄<sup><a href="#provider-scope-15">15</a></sup></td></tr>
</tbody>
<tbody>
<tr><th scope="rowgroup" rowspan="1"><strong>opencode</strong><br><small>Platform</small></th><td>API <sup><a href="#provider-scope-16" aria-label="Verified scope 16">16</a></sup><br><sub>Messages</sub></td><td>🔄</td><td>🔄</td><td>🔄</td><td>🔄</td><td>⬜<sup><a href="#provider-scope-16">16</a></sup></td><td>🔄<sup><a href="#provider-scope-16">16</a></sup></td></tr>
</tbody>
</table>

<details>
<summary>More capabilities — compare all providers together</summary>

**Tools and desktop use**

<table id="provider-tools-matrix">
<thead><tr><th>Provider</th><th>Connection</th><th>Skills</th><th>Browser</th><th>Computer use</th><th>Review</th></tr></thead>
<tbody><tr><th colspan="6">China-based providers</th></tr></tbody>
<tbody>
<tr><th scope="rowgroup" rowspan="2"><strong>DeepSeek</strong></th><td>API <sup><a href="#provider-scope-1" aria-label="Verified scope 1">1</a></sup><br><sub>Chat</sub></td><td>🔄</td><td>⚠️<br><sub>Partial</sub></td><td>🔄</td><td>🔄</td></tr>
<tr><td>API <sup><a href="#provider-scope-2" aria-label="Verified scope 2">2</a></sup><br><sub>Responses</sub></td><td>🔄</td><td>⚠️<br><sub>Partial</sub></td><td>🔄</td><td>🔄</td></tr>
</tbody>
<tbody>
<tr><th scope="rowgroup" rowspan="2"><strong>Qwen</strong></th><td>Token Plan <sup><a href="#provider-scope-3" aria-label="Verified scope 3">3</a></sup><br><sub>Responses</sub></td><td>🔄</td><td>⬜</td><td>⬜</td><td>⬜</td></tr>
<tr><td>Third-party API <sup><a href="#provider-scope-4" aria-label="Verified scope 4">4</a></sup><br><sub>Responses</sub></td><td>⬜</td><td>⬜</td><td>⬜</td><td>⬜</td></tr>
</tbody>
<tbody>
<tr><th scope="rowgroup" rowspan="1"><strong>Zhipu</strong></th><td>Coding Plan <sup><a href="#provider-scope-5" aria-label="Verified scope 5">5</a></sup><br><sub>Responses</sub></td><td>✅</td><td>⬜</td><td>⚠️<br><sub>Not passed</sub></td><td>✅</td></tr>
</tbody>
<tbody>
<tr><th scope="rowgroup" rowspan="1"><strong>Moonshot</strong></th><td>API <sup><a href="#provider-scope-6" aria-label="Verified scope 6">6</a></sup><br><sub>Responses</sub></td><td>🔄</td><td>🔄</td><td>⚠️<br><sub>Not passed</sub></td><td>⚠️<br><sub>Not passed</sub></td></tr>
</tbody>
<tbody>
<tr><th scope="rowgroup" rowspan="1"><strong>Xiaomi</strong></th><td>Token Plan <sup><a href="#provider-scope-7" aria-label="Verified scope 7">7</a></sup><br><sub>Responses</sub></td><td>🔄</td><td>⚠️<br><sub>Not passed</sub></td><td>⚠️<br><sub>Not passed</sub></td><td>🔄</td></tr>
</tbody>
<tbody>
<tr><th scope="rowgroup" rowspan="1"><strong>MiniMax</strong></th><td>Token Plan <sup><a href="#provider-scope-8" aria-label="Verified scope 8">8</a></sup><br><sub>Messages</sub></td><td>🔄</td><td>🔄</td><td>⚠️<br><sub>Partial</sub></td><td>⚠️<br><sub>Not passed</sub></td></tr>
</tbody>
<tbody>
<tr><th scope="rowgroup" rowspan="1"><strong>Volcengine</strong></th><td>Coding Plan <sup><a href="#provider-scope-9" aria-label="Verified scope 9">9</a></sup><br><sub>Responses</sub></td><td>🔄</td><td>⬜</td><td>🔄</td><td>⚠️<br><sub>Partial</sub></td></tr>
</tbody>
<tbody><tr><th colspan="6">US-based providers</th></tr></tbody>
<tbody>
<tr><th scope="rowgroup" rowspan="2"><strong>OpenAI</strong></th><td>Official account <sup><a href="#provider-scope-10" aria-label="Verified scope 10">10</a></sup><br><sub>Responses</sub></td><td>✅</td><td>✅<br><sub>Per entry</sub></td><td>✅<br><sub>Per entry</sub></td><td>✅</td></tr>
<tr><td>Third-party API <sup><a href="#provider-scope-11" aria-label="Verified scope 11">11</a></sup><br><sub>Responses</sub></td><td>✅</td><td>✅</td><td>✅</td><td>✅</td></tr>
</tbody>
<tbody>
<tr><th scope="rowgroup" rowspan="1"><strong>Anthropic</strong></th><td>Third-party API <sup><a href="#provider-scope-12" aria-label="Verified scope 12">12</a></sup><br><sub>Messages</sub></td><td>🔄</td><td>🔄</td><td>⚠️<br><sub>Partial</sub></td><td>⚠️<br><sub>Not passed</sub></td></tr>
</tbody>
<tbody>
<tr><th scope="rowgroup" rowspan="1"><strong>Google</strong></th><td>Third-party API <sup><a href="#provider-scope-13" aria-label="Verified scope 13">13</a></sup><br><sub>Messages</sub></td><td>🔄<br><sub>Historical</sub></td><td>🔄<br><sub>Historical</sub></td><td>⬜</td><td>🔄<br><sub>Historical</sub></td></tr>
</tbody>
<tbody>
<tr><th scope="rowgroup" rowspan="1"><strong>xAI</strong></th><td>Third-party API <sup><a href="#provider-scope-14" aria-label="Verified scope 14">14</a></sup><br><sub>Responses</sub></td><td>⚠️<br><sub>Limited</sub></td><td>✅</td><td>✅</td><td>✅</td></tr>
</tbody>
<tbody><tr><th colspan="6">Connection platforms</th></tr></tbody>
<tbody>
<tr><th scope="rowgroup" rowspan="1"><strong>CommandCode</strong><br><small>Platform</small></th><td>API <sup><a href="#provider-scope-15" aria-label="Verified scope 15">15</a></sup><br><sub>Chat</sub></td><td>🔄</td><td>🔄</td><td>🔄</td><td>⬜</td></tr>
</tbody>
<tbody>
<tr><th scope="rowgroup" rowspan="1"><strong>opencode</strong><br><small>Platform</small></th><td>API <sup><a href="#provider-scope-16" aria-label="Verified scope 16">16</a></sup><br><sub>Messages</sub></td><td>🔄</td><td>⬜</td><td>⬜</td><td>⬜</td></tr>
</tbody>
</table>

**Discovery, reasoning, and search**

<table id="provider-media-matrix">
<thead><tr><th>Provider</th><th>Connection</th><th>Site tools</th><th>Reasoning</th><th>PDF</th><th>Search</th></tr></thead>
<tbody><tr><th colspan="6">China-based providers</th></tr></tbody>
<tbody>
<tr><th scope="rowgroup" rowspan="2"><strong>DeepSeek</strong></th><td>API <sup><a href="#provider-scope-1" aria-label="Verified scope 1">1</a></sup><br><sub>Chat</sub></td><td>🔄</td><td>🔄<br><sub>API</sub></td><td>🚫<br><sub>Standard direct path</sub></td><td>⬜<br><sub>Search use unconfirmed</sub></td></tr>
<tr><td>API <sup><a href="#provider-scope-2" aria-label="Verified scope 2">2</a></sup><br><sub>Responses</sub></td><td>🔄</td><td>⬜<br><sub>Separate level checks</sub></td><td>⚠️<br><sub>Usability unconfirmed</sub></td><td>⬜<br><sub>Search use unconfirmed</sub></td></tr>
</tbody>
<tbody>
<tr><th scope="rowgroup" rowspan="2"><strong>Qwen</strong></th><td>Token Plan <sup><a href="#provider-scope-3" aria-label="Verified scope 3">3</a></sup><br><sub>Responses</sub></td><td>⬜</td><td>⬜<br><sub>Per-level checks</sub></td><td>⬜</td><td>⬜</td></tr>
<tr><td>Third-party API <sup><a href="#provider-scope-4" aria-label="Verified scope 4">4</a></sup><br><sub>Responses</sub></td><td>⬜</td><td>⚠️<br><sub>Historical API pass; later blocked</sub></td><td>⚠️<br><sub>Not passed</sub></td><td>⬜</td></tr>
</tbody>
<tbody>
<tr><th scope="rowgroup" rowspan="1"><strong>Zhipu</strong></th><td>Coding Plan <sup><a href="#provider-scope-5" aria-label="Verified scope 5">5</a></sup><br><sub>Responses</sub></td><td>⚠️<br><sub>Not passed</sub></td><td>✅<br><sub>API</sub></td><td>⚠️<br><sub>Content check not passed</sub></td><td>⬜<br><sub>Search use unconfirmed</sub></td></tr>
</tbody>
<tbody>
<tr><th scope="rowgroup" rowspan="1"><strong>Moonshot</strong></th><td>API <sup><a href="#provider-scope-6" aria-label="Verified scope 6">6</a></sup><br><sub>Responses</sub></td><td>🔄</td><td>✅<br><sub>API</sub></td><td>⚠️<br><sub>Upstream rejected</sub></td><td>⬜</td></tr>
</tbody>
<tbody>
<tr><th scope="rowgroup" rowspan="1"><strong>Xiaomi</strong></th><td>Token Plan <sup><a href="#provider-scope-7" aria-label="Verified scope 7">7</a></sup><br><sub>Responses</sub></td><td>🔄</td><td>✅<br><sub>API</sub></td><td>⚠️<br><sub>Upstream rejected</sub></td><td>⬜</td></tr>
</tbody>
<tbody>
<tr><th scope="rowgroup" rowspan="1"><strong>MiniMax</strong></th><td>Token Plan <sup><a href="#provider-scope-8" aria-label="Verified scope 8">8</a></sup><br><sub>Messages</sub></td><td>⚠️<br><sub>Partial</sub></td><td>⚠️<br><sub>high passed; none had deviations</sub></td><td>🔄<br><sub>API</sub></td><td>⬜</td></tr>
</tbody>
<tbody>
<tr><th scope="rowgroup" rowspan="1"><strong>Volcengine</strong></th><td>Coding Plan <sup><a href="#provider-scope-9" aria-label="Verified scope 9">9</a></sup><br><sub>Responses</sub></td><td>🔄</td><td>✅<br><sub>API; actual reasoning level unconfirmed</sub></td><td>✅<br><sub>API</sub></td><td>⬜</td></tr>
</tbody>
<tbody><tr><th colspan="6">US-based providers</th></tr></tbody>
<tbody>
<tr><th scope="rowgroup" rowspan="2"><strong>OpenAI</strong></th><td>Official account <sup><a href="#provider-scope-10" aria-label="Verified scope 10">10</a></sup><br><sub>Responses</sub></td><td>✅<br><sub>Per entry</sub></td><td>✅<br><sub>Per model</sub></td><td>✅<br><sub>Per entry</sub></td><td>✅<br><sub>Per service</sub></td></tr>
<tr><td>Third-party API <sup><a href="#provider-scope-11" aria-label="Verified scope 11">11</a></sup><br><sub>Responses</sub></td><td>⚠️<br><sub>Partial</sub></td><td>⚠️<br><sub>Higher-level deviations</sub></td><td>✅<br><sub>API</sub></td><td>⬜<br><sub>Search use unconfirmed</sub></td></tr>
</tbody>
<tbody>
<tr><th scope="rowgroup" rowspan="1"><strong>Anthropic</strong></th><td>Third-party API <sup><a href="#provider-scope-12" aria-label="Verified scope 12">12</a></sup><br><sub>Messages</sub></td><td>⚠️<br><sub>Not passed</sub></td><td>🔄<br><sub>API mapping</sub></td><td>🔄<br><sub>API</sub></td><td>🔄<br><sub>Tested search chain; per gateway</sub></td></tr>
</tbody>
<tbody>
<tr><th scope="rowgroup" rowspan="1"><strong>Google</strong></th><td>Third-party API <sup><a href="#provider-scope-13" aria-label="Verified scope 13">13</a></sup><br><sub>Messages</sub></td><td>⬜</td><td>🔄<br><sub>API; gateway limited</sub></td><td>⚠️<br><sub>Content check not passed</sub></td><td>⬜</td></tr>
</tbody>
<tbody>
<tr><th scope="rowgroup" rowspan="1"><strong>xAI</strong></th><td>Third-party API <sup><a href="#provider-scope-14" aria-label="Verified scope 14">14</a></sup><br><sub>Responses</sub></td><td>⚠️<br><sub>Partial</sub></td><td>✅<br><sub>API</sub></td><td>⚠️<br><sub>Upstream rejected</sub></td><td>⚠️<br><sub>Per gateway and search path</sub></td></tr>
</tbody>
<tbody><tr><th colspan="6">Connection platforms</th></tr></tbody>
<tbody>
<tr><th scope="rowgroup" rowspan="1"><strong>CommandCode</strong><br><small>Platform</small></th><td>API <sup><a href="#provider-scope-15" aria-label="Verified scope 15">15</a></sup><br><sub>Chat</sub></td><td>⬜</td><td>⬜<br><sub>Per-level checks</sub></td><td>🚫<br><sub>Standard direct path</sub></td><td>⬜</td></tr>
</tbody>
<tbody>
<tr><th scope="rowgroup" rowspan="1"><strong>opencode</strong><br><small>Platform</small></th><td>API <sup><a href="#provider-scope-16" aria-label="Verified scope 16">16</a></sup><br><sub>Messages</sub></td><td>⬜</td><td>⬜<br><sub>Per-level checks</sub></td><td>⬜</td><td>🔄<br><sub>Separate search executor</sub></td></tr>
</tbody>
</table>

</details>

**Verified models and conditions**

The numbered conditions belong to the overview markers. Results apply only to these models and tested platforms, not every model from a vendor. API-level checks do not establish full desktop support; historical results do not guarantee current availability.

<table id="provider-scope-table">
<thead><tr><th>No.</th><th>Provider / connection</th><th>Verified model</th><th>Conditions</th></tr></thead>
<tbody><tr><th colspan="4">China-based providers</th></tr></tbody>
<tbody>
<tr id="provider-scope-1"><td>1</td><td><strong>DeepSeek</strong><br>API<br><sub>Chat Completions</sub></td><td><code>deepseek-v4-pro</code></td><td>See the capability limits in the table above.<br><sub>Overview notes: Subtasks：Partial; Images：Tested text-only model.</sub></td></tr>
<tr id="provider-scope-2"><td>2</td><td><strong>DeepSeek</strong><br>API<br><sub>Responses</sub></td><td><code>deepseek-v4-pro</code></td><td>See the capability limits in the table above.<br><sub>Overview notes: Files：Tool bridge; MCP：Tool / authentication differences; Subtasks：Partial; Images：Tested text-only model.</sub></td></tr>
<tr id="provider-scope-3"><td>3</td><td><strong>Qwen</strong><br>Token Plan<br><sub>Responses</sub></td><td><code>qwen3.8-flash</code></td><td>Token Plan and third-party API are separate connections. Request rejection on the third-party gateway is not a result for Token Plan.<br><sub>Overview notes: Files：Tool bridge; Images：Desktop image reading; History：Cross-model chain.</sub></td></tr>
<tr id="provider-scope-4"><td>4</td><td><strong>Qwen</strong><br>Third-party API<br><sub>Responses</sub></td><td><code>qwen3.7-plus</code></td><td>See the capability limits in the table above.<br><sub>Overview notes: Files：Upstream blocked; Patch：Upstream blocked; Images：Historical API pass; later blocked; History：Upstream blocked.</sub></td></tr>
<tr id="provider-scope-5"><td>5</td><td><strong>Zhipu</strong><br>Coding Plan<br><sub>Responses</sub></td><td><code>glm-5.3</code></td><td>See the capability limits in the table above.<br><sub>Overview notes: Subtasks：Partial; Images：Content check not passed.</sub></td></tr>
<tr id="provider-scope-6"><td>6</td><td><strong>Moonshot</strong><br>API<br><sub>Responses</sub></td><td><code>kimi-k2.7-code-highspeed</code></td><td>See the capability limits in the table above.<br><sub>Overview notes: Subtasks：Partial; Images：API.</sub></td></tr>
<tr id="provider-scope-7"><td>7</td><td><strong>Xiaomi</strong><br>Token Plan<br><sub>Responses</sub></td><td><code>mimo-v2.5-pro</code></td><td>Recovery from image history proves conversation continuation, not image understanding.<br><sub>Overview notes: Patch：Desktop use unconfirmed; Subtasks：Partial; Images：Upstream rejected.</sub></td></tr>
<tr id="provider-scope-8"><td>8</td><td><strong>MiniMax</strong><br>Token Plan<br><sub>Anthropic Messages</sub></td><td><code>MiniMax-M3</code></td><td>Small-image desktop cases passed; larger images have a separate upstream limit.<br><sub>Overview notes: MCP：Tested tools only; Subtasks：Partial; Images：Desktop; large-image limit.</sub></td></tr>
<tr id="provider-scope-9"><td>9</td><td><strong>Volcengine</strong><br>Coding Plan<br><sub>Responses</sub></td><td><code>ark-code-latest</code></td><td>See the capability limits in the table above.<br><sub>Overview notes: Patch：Patching passed in some tested tasks; MCP：Tested tools only; Subtasks：Partial; Images：Entry unconfirmed.</sub></td></tr>
</tbody>
<tbody><tr><th colspan="4">US-based providers</th></tr></tbody>
<tbody>
<tr id="provider-scope-10"><td>10</td><td><strong>OpenAI</strong><br>Official account<br><sub>Responses</sub></td><td>Account-available models</td><td>See the capability limits in the table above.<br><sub>Overview notes: MCP：Per connection; Images：Per model.</sub></td></tr>
<tr id="provider-scope-11"><td>11</td><td><strong>OpenAI</strong><br>Third-party API<br><sub>Responses</sub></td><td><code>gpt-5.6-sol</code></td><td>See the capability limits in the table above.<br><sub>Overview notes: Patch：Desktop use unconfirmed; Subtasks：Partial; Images：API.</sub></td></tr>
<tr id="provider-scope-12"><td>12</td><td><strong>Anthropic</strong><br>Third-party API<br><sub>Anthropic Messages</sub></td><td><code>claude-sonnet-4-6</code></td><td>These results are from third-party Claude gateways. MCP and search results vary by gateway and do not certify Anthropic's official API.<br><sub>Overview notes: MCP：Varies by gateway; Subtasks：Partial; Images：API.</sub></td></tr>
<tr id="provider-scope-13"><td>13</td><td><strong>Google</strong><br>Third-party API<br><sub>Anthropic Messages</sub></td><td><code>gemini-3.1-pro</code></td><td>Historical successes are retained for the tested gateway, which also had quota / rate-limit blocks. They do not guarantee current availability.<br><sub>Overview notes: Files：Historical; Patch：Not passed; MCP：Not passed; Subtasks：Not passed; Images：API; gateway limited; History：Historical.</sub></td></tr>
<tr id="provider-scope-14"><td>14</td><td><strong>xAI</strong><br>Third-party API<br><sub>Responses</sub></td><td><code>grok-4.6</code></td><td>See the capability limits in the table above.<br><sub>Overview notes: Patch：Desktop not passed; MCP：Not passed; Subtasks：Not passed; Images：API.</sub></td></tr>
</tbody>
<tbody><tr><th colspan="4">Connection platforms</th></tr></tbody>
<tbody>
<tr id="provider-scope-15"><td>15</td><td><strong>CommandCode</strong><br>API<br><sub>Chat Completions</sub></td><td><code>z-ai/glm-5.3-flash</code></td><td>The image continuation result does not establish subtask support. Computer-use evidence is limited to the tested Calculator task.<br><sub>Overview notes: Images：Desktop image reading; History：Cross-model chain.</sub></td></tr>
<tr id="provider-scope-16"><td>16</td><td><strong>opencode</strong><br>API<br><sub>Anthropic Messages</sub></td><td><code>qwen3.8-flash</code></td><td>The tested connection completed parent waiting and child-result aggregation, and separately passed stream cancellation and recovery. Search uses a separate executor, not proven native provider search.<br><sub>Overview notes: Images：Independent image reading; History：Cross-model chain.</sub></td></tr>
</tbody>
</table>

<details>
<summary>How to read the capability results</summary>

- Results apply only to the model, plan, gateway, and tested platform listed for each connection. “Historical” retains the scope of the earlier result; it does not guarantee availability now.
- “API” means a real upstream request passed, not that the full Codex Desktop flow passed. Image and PDF checks cover tested content only; direct PDF input is distinct from local file tools.
- Conversation history covers tested lightweight context or cross-model chains, not unlimited context. Computer use refers to tested Calculator cases, not arbitrary desktop applications.
- Subtasks include creation, execution, returned results, and target inheritance. Partial success stays ⚠️. Separate search services can return sources to the selected model without establishing native provider search.

PTY interruption and recovery have records for both DeepSeek protocols, GLM, third-party GPT, and Volcengine targets. Stream cancellation is a separate scenario. Unconfirmed scheduled triggers, voice delegation, persistent memory, and complete artifact previews are not per-provider promises.

Strict structured output, dynamic discovery, hosted tools, and private state depend on the exact connection; consult the protocol tables. These tables and Pelican results do not rank model intelligence.

</details>

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

<a id="start"></a>

## Start here

1. **Install Aiotto and Codex Desktop.** Choose your system's package from the [latest release](https://github.com/ShawnZhuge/aiotto/releases/latest), then follow the [installation instructions](#install).
2. **Add an account or provider.** Use an official account or configure a provider endpoint, Key, and model. Preview existing data before importing it.
3. **Start a task in Codex.** For third-party models, enable Aiotto Smart Router, select a model, and try a familiar small task.

<a id="install"></a>

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

## Safety and feedback

- Never post account credentials, API keys, tokens, or personal information in issues, screenshots, or logs.
- Before using a third-party relay, review its pricing, data-processing policy, and terms.
- Report problems through [GitHub Issues](https://github.com/ShawnZhuge/aiotto/issues).

The project uses the [Apache License 2.0](LICENSE).

Aiotto is an independent local workflow tool for Codex and is not affiliated with, endorsed by, or sponsored by OpenAI.

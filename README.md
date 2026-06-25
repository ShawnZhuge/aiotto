<p align="center">
  <img src="assets/app-icon.png" alt="Aiotto" width="128" height="128" />
</p>

<h1 align="center">Aiotto</h1>

<p align="center">
  <strong>面向 OpenAI Codex 的原生桌面伴侣 —— 账号、额度、中转路由、会话与本地配置，一个应用全搞定。</strong>
</p>

<p align="center">
  简体中文 · <a href="./README_EN.md">English</a>
</p>

<p align="center">
  <img alt="Platform" src="https://img.shields.io/badge/macOS-12%2B-black" />
  <img alt="Tauri" src="https://img.shields.io/badge/Tauri-2.x-24C8DB" />
  <img alt="Rust" src="https://img.shields.io/badge/Rust-stable-orange" />
  <img alt="License" src="https://img.shields.io/badge/License-Apache--2.0-blue" />
</p>

---

## 为什么需要 Aiotto

用 Codex 久了你大概都踩过这些坑：

- **多账号切换靠手改文件** —— 换个账号要去翻 `~/.codex/auth.json`、`config.toml`，改错一个字就登录异常。
- **额度说没就没** —— 5 小时 / 每周额度触顶，任务正跑到一半被打断，还得手动找哪个账号还有余量、重登、重启 Codex。
- **想用第三方中转模型很麻烦** —— 配置散、连不连得通靠猜，切过去之后历史会话还容易"续不上"。
- **本地状态像一团乱麻** —— 账号、会话、MCP、Skills、路由、备份散落在 `~/.codex` 下十几个 TOML / JSON / SQLite 文件里，没有一个能一眼看全的地方。
- **用量和成本不透明** —— token 花在哪、缓存命中多少、这个月花了多少，心里没数。

**Aiotto 基于 Tauri 2 + React + Rust + 原生 Swift 状态栏**，把这些高频操作收敛进一个精致的桌面应用，在本地安全读写 Codex 数据，少改文件、少出错、少中断。

---

## 核心能力

| 模块 | 解决的痛点 |
| --- | --- |
| **账号管理** | 多账号一屏总览额度、快照与登录状态，一键切换默认账号，告别手改 `auth.json` |
| **账号自动切换** | 额度触顶自动切到可用账号并平滑重启 Codex，任务不再半路卡死 |
| **中转管理** | Provider 配置、余额探测、连通性测试、配置导入导出与路由诊断修复，一站式 |
| **智能路由** | 在 Codex 桌面内直接使用第三方中转模型，并尽量保留历史线程可续聊 |
| **会话管理** | 基于真实索引安全浏览、统计与批量清理本地线程，支持分支 / 项目级操作 |
| **使用统计** | Session token、缓存命中、请求量、来源模型与成本定价，专业数据视图 |
| **状态栏** | macOS 菜单栏实时显示账号额度、Provider 与路由状态，深浅色自适应 |
| **MCP / Skills** | 图形化管理 MCP 条目与 Skills 生命周期，支持备份与恢复 |
| **备份中心** | 关键配置一键备份 / 恢复，带 manifest 与文件 hash，恢复前自动留底 |
| **维护工具** | 一键诊断、修复中转路由、清理无效数据，保留高级运行时日志 |
| **设置与外观** | 4 套主题 × 深浅色、双语、额度刷新策略、通知与隐私选项 |

> **关于智能路由：** 中转模型经 Aiotto 本地代理转发，使用期间需保持 Aiotto 运行。
> **额度归额度，余额归余额：** 登录账号额度与 Provider 余额在视觉与技术上始终分开，不混淆。

<p align="center">
  <img src="assets/screenshot-dashboard.png" alt="Aiotto 仪表盘" width="1100" />
</p>

---

## 设计

精致、克制、适合高频使用的桌面观感：统一的字体层级与间距、克制的动效（只服务于状态反馈）、完整的 reduced-motion 支持，以及 **4 套可在设置中切换的主题**（蓝紫 / 青绿 / 靛蓝 / 玫红），每套都适配深浅色。

---

## 平台支持

| 平台 | 说明 |
| --- | --- |
| macOS | Apple Silicon + Intel，macOS 12+（含原生菜单栏状态项） |
| Windows / Linux | 规划中 |

---

## 技术栈

Tauri 2 · React 19 · TypeScript · Vite · Tailwind CSS · shadcn/ui · Rust · Swift / AppKit（菜单栏助手）

---

## 快速开始

**环境要求：** Node.js · pnpm · Rust · [Tauri 系统依赖](https://v2.tauri.app/start/prerequisites/)

```bash
git clone https://github.com/ShawnZhuge/aiotto.git
cd aiotto
pnpm install
pnpm tauri:dev          # 启动开发版
```

```bash
pnpm build                                          # 前端构建检查
cargo check --manifest-path apps/desktop/src-tauri/Cargo.toml   # Rust 检查
pnpm tauri:build                                    # 生产构建
```

---

## 架构

```text
React UI ── invoke() ──▶ Tauri 命令 ──▶ Rust core
                                          ├── ~/.codex            (Codex 原生数据)
                                          └── ~/.codex/.aiotto/   (Aiotto 自有数据)
                         Swift 菜单栏助手 ◀── 状态同步 (IPC)
```

---

## 版本说明

本仓库为 **Aiotto 社区版**：包含完整的应用外壳、UI 设计系统、会话、使用统计、MCP / Skills、备份与设置等能力。账号自动切换、中转 / 智能路由注入等涉及核心策略的实现不随社区版开源。

---

## 社区交流

遇到问题、想提需求，或单纯来摸鱼，欢迎加入 **Aiotto 獭獭码头 🦦**

👉 **[点此获取最新微信群二维码](https://docs.qq.com/doc/DUVdNY2trT3Nsam9B)**

> 群二维码会定期更新，扫文档里的最新码即可入群。

---

## 参与贡献

欢迎提交 Issue 与 Pull Request。较大改动建议先开 Issue 讨论方案。请注意本项目会读写本地 Codex 数据，贡献时务必遵守相应的数据安全约定。

---

## 许可证

[Apache License 2.0](LICENSE)

---

## 免责声明

Aiotto 是独立的 Codex 本地工作流工具，与 OpenAI 无隶属、背书或赞助关系。使用第三方中转服务请自行评估风险并遵守相应条款。

<p align="center">
  <img src="assets/app-icon.png" alt="Aiotto" width="128" height="128" />
</p>

<h1 align="center">Aiotto</h1>

<p align="center">
  <strong>面向 OpenAI Codex 的原生桌面工作台 —— 账号、额度、中转路由、会话、用量与本地配置，一个应用集中管理。</strong>
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

## 获取 Aiotto

普通用户建议直接从 [GitHub Releases](https://github.com/ShawnZhuge/aiotto/releases) 下载最新 macOS 安装包。Release 安装包提供完整产品体验。

本仓库同时提供公开源码树，方便社区查看、构建和参与公开模块的改进。

---

## 为什么需要 Aiotto

Codex 用久了，常见问题会集中在几个地方：账号状态不清楚、额度消耗不透明、模型服务配置分散、历史会话难整理、本地配置改动缺少备份。Aiotto 把这些高频工作收敛进一个桌面应用，减少手工切换、排查和重复配置。

---

## 完整产品能力

| 模块 | 解决的痛点 |
| --- | --- |
| **账号管理** | 多账号状态、额度、快照与登录情况集中查看 |
| **账号自动切换** | 额度触顶或账号不可用时，自动切换到可用账号并恢复工作流 |
| **中转管理** | 集中管理第三方模型服务配置、连通性、余额和可用状态 |
| **智能路由** | 在 Codex 工作流中更顺滑地使用不同模型服务 |
| **会话管理** | 浏览、搜索、统计和整理本地 Codex 会话 |
| **使用统计** | 查看请求量、token、缓存命中、模型和成本趋势 |
| **状态栏** | 在 macOS 状态栏快速查看关键状态和常用操作 |
| **MCP / Skills** | 盘点本机扩展条目、健康状态和基础信息 |
| **备份中心** | 创建、查看和恢复关键本地配置备份 |
| **运行诊断** | 检查 Codex CLI、目录状态、本地依赖和运行环境 |
| **设置与外观** | 管理主题、语言、通知、更新和界面偏好 |

<p align="center">
  <img src="assets/screenshot-dashboard.png" alt="Aiotto 仪表盘" width="1100" />
</p>

---

## 平台支持

| 平台 | 说明 |
| --- | --- |
| macOS | Apple Silicon + Intel，macOS 12+ |
| Windows / Linux | 暂未提供 |

---

## 技术栈

Tauri 2 · React 19 · TypeScript · Vite · Tailwind CSS · shadcn/ui · Rust · macOS system integration

---

## 从源码运行

**环境要求：** Node.js · pnpm · Rust · [Tauri 系统依赖](https://v2.tauri.app/start/prerequisites/)

```bash
git clone https://github.com/ShawnZhuge/aiotto.git
cd aiotto
pnpm install
pnpm tauri:dev
```

```bash
pnpm build
cargo check --manifest-path apps/desktop/src-tauri/Cargo.toml
pnpm tauri:build
```

---

## 架构概览

```text
React UI -> Tauri commands -> Rust runtime -> local Codex data
```

---

## 公开源码说明

本仓库是 Aiotto 的公开源码树，用于展示和协作公开模块。完整安装包能力以 GitHub Releases 发布版本为准。

---

## 参与贡献

欢迎提交 Issue 与 Pull Request。较大改动建议先开 Issue 讨论方案。请注意本项目会读取和写入本地 Codex 数据，贡献时务必遵守相应的数据安全约定。

---

## 许可证

[Apache License 2.0](LICENSE)

---

## 免责声明

Aiotto 是独立的 Codex 本地工作流工具，与 OpenAI 无隶属、背书或赞助关系。使用第三方服务时，请自行评估风险并遵守相应条款。

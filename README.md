<p align="center">
  <img src="assets/app-icon.png" alt="Aiotto" width="128" height="128" />
</p>

<h1 align="center">Aiotto</h1>

<p align="center">
  <strong>面向 OpenAI Codex 的一站式原生桌面工作台</strong>
</p>

<p align="center">
  集中管理账号与额度、中转与智能路由、会话、统计、扩展和桌面状态。
</p>

<p align="center">
  简体中文 · <a href="./README_EN.md">English</a>
</p>

<p align="center">
  <a href="https://github.com/ShawnZhuge/aiotto/releases/latest"><img alt="Release" src="https://img.shields.io/github/v/release/ShawnZhuge/aiotto?display_name=tag&label=Release" /></a>
  <a href="https://github.com/ShawnZhuge/aiotto/releases"><img alt="Downloads" src="https://img.shields.io/github/downloads/ShawnZhuge/aiotto/total?label=Downloads" /></a>
  <img alt="Platform" src="https://img.shields.io/badge/macOS-12%2B-black" />
  <img alt="Tauri" src="https://img.shields.io/badge/Tauri-2.x-24C8DB" />
  <img alt="License" src="https://img.shields.io/badge/License-Apache--2.0-blue" />
</p>

<p align="center">
  <a href="https://github.com/ShawnZhuge/aiotto/releases/latest"><strong>下载最新版</strong></a>
  ·
  <a href="https://github.com/ShawnZhuge/aiotto/issues">提交反馈</a>
</p>

<p align="center">
  <img src="assets/screenshot-dashboard.png" alt="Aiotto 仪表盘" width="1100" />
</p>

---

## 为什么选择 Aiotto

Codex 使用时间越长，账号状态、额度窗口、模型服务、历史会话和本地配置就越容易分散。很多操作需要在不同页面、文件和工具之间来回切换，既耗时，也容易遗漏备份或误改配置。

Aiotto 把这些日常工作集中到一个 macOS 桌面应用里：重要状态可以直接查看，高风险操作会先提示并保留恢复路径，常用动作也能从状态栏快速完成。

## 完整产品能力

### 账号与额度

- 集中查看多个 Codex 账号的登录状态、套餐、凭据健康度、5 小时额度和每周额度。
- 保存、导入、导出和整理本地账号快照，在确认后切换账号并恢复工作状态。
- 支持额度刷新、阈值提醒、账号自动切换和五小时额度计划，减少额度耗尽后的人工排查。

### 中转与智能路由

- 管理 OpenAI-compatible 与 Anthropic-compatible 模型服务，统一查看模型、余额、延迟和可用状态。
- 支持添加、编辑、删除、导入和导出中转配置，并提供模型拉取、连通性测试和诊断信息。
- 通过 Codex 智能路由在官方模型与中转模型之间灵活选择，并提供 API 登录模式、生图工具兼容和请求日志导出。

### 会话、存储与统计

- 浏览、搜索、筛选、置顶和继续本地 Codex 会话，并支持归档、回收、恢复和导出。
- 查看请求量、输入输出 token、缓存读写、模型来源和成本趋势，区分官方与中转使用情况。
- 分析本地存储构成和会话文件占用，预览安全清理建议，并通过备份与复检降低误删风险。

### 状态栏与消息

- 在 macOS 状态栏查看当前账号、额度、Provider 余额、Router 状态和最近会话。
- 自定义显示模块、顺序、样式、隐私模式、点击行为和 Hotspot，支持登录后自动启动。
- 查看 OpenAI、ChatGPT 与 Codex 服务状态和事故进展，并接收应用内提醒、macOS 系统通知、消息与公告。
- 提供赞助支持入口，方便用户了解项目支持方式。

### 扩展、维护与设置

- 盘点 Codex Skills 与 MCP 配置的来源、状态、基础信息和健康情况。
- 通过备份中心查看历史记录、恢复入口和导出位置；通过维护工具运行系统诊断、安全清理和常见问题修复。
- 管理主题、语言、登录启动、账号网络、刷新频率、通知动效、隐私偏好和自动更新。

## 下载与安装

### 系统要求

- macOS 12 Monterey 或更高版本
- Apple Silicon 与 Intel Mac
- Universal 安装包

### 安装步骤

1. 打开 [最新 Release](https://github.com/ShawnZhuge/aiotto/releases/latest)。
2. 下载文件名以 `_universal.dmg` 结尾的安装包。
3. 打开 DMG，将 Aiotto 拖入“应用程序”文件夹。

当前安装包尚未完成 Apple Developer ID 签名与公证。首次打开时请在 Finder 中右键 Aiotto 并选择“打开”。如果 macOS 仍提示应用已损坏，可在确认安装包来自本项目官方 Release 后执行：

```bash
xattr -cr /Applications/Aiotto.app
```

## 版本支持

Aiotto 目前处于 `0.x` 快速迭代阶段，只维护最新发布版本。遇到问题时，请先升级到 [最新版本](https://github.com/ShawnZhuge/aiotto/releases/latest) 再提交反馈。

每个正式版本都会提供：

- macOS DMG 安装包
- 应用内自动更新文件
- 对应版本说明与升级提醒

## 社区源码

本项目提供可独立构建的社区桌面应用，适合体验产品界面、学习桌面应用工程结构并参与改进。普通用户建议直接下载 GitHub Release。

### 本地运行

```bash
git clone https://github.com/ShawnZhuge/aiotto.git
cd aiotto
pnpm install
pnpm dev
```

### 构建检查

```bash
pnpm build
cargo check --locked --manifest-path src-tauri/Cargo.toml
pnpm tauri:build
```

### 项目结构

```text
src/          React 社区界面
src-tauri/    Tauri 桌面应用
assets/       品牌与产品图片
```

## 安全与隐私

- 不要在 Issue、截图或日志中上传账号凭据、API Key、令牌或其他个人信息。
- 切换账号、修改配置、恢复数据和执行清理前，请确认界面展示的影响范围与备份状态。
- 使用第三方模型服务时，请自行确认其计费方式、数据处理政策与服务条款。

## 反馈与贡献

欢迎通过 [GitHub Issues](https://github.com/ShawnZhuge/aiotto/issues) 提交问题、功能建议和使用反馈。提交问题时建议包含：

- macOS 版本与 Mac 芯片类型
- Aiotto 版本
- 可复现步骤与脱敏后的错误信息

## 许可证

[Apache License 2.0](LICENSE)

## 免责声明

Aiotto 是独立的 Codex 本地工作流工具，与 OpenAI 无隶属、背书或赞助关系。使用第三方服务时，请自行评估风险并遵守相应条款。

<p align="center">
  <img src="assets/app-icon.png" alt="Aiotto" width="112" height="112" />
</p>

<h1 align="center">Aiotto</h1>

<p align="center">
  <strong>Codex 多账号与多中转管理器</strong>
</p>

<p align="center">
  集中看额度、快速切换账号，把官方模型和不同协议的中转模型放进同一个列表。
</p>

<p align="center">
  简体中文 · <a href="./README_EN.md">English</a>
</p>

<p align="center">
  <a href="https://github.com/ShawnZhuge/aiotto/releases/latest"><img alt="Release" src="https://img.shields.io/github/v/release/ShawnZhuge/aiotto?display_name=tag&label=Release" /></a>
  <a href="https://github.com/ShawnZhuge/aiotto/releases"><img alt="Downloads" src="https://img.shields.io/github/downloads/ShawnZhuge/aiotto/total?label=Downloads" /></a>
  <img alt="Platform" src="https://img.shields.io/badge/macOS-12%2B-black" />
  <img alt="Platform" src="https://img.shields.io/badge/Windows-10%2F11_x64-0078D4" />
  <img alt="License" src="https://img.shields.io/badge/License-Apache--2.0-blue" />
</p>

<p align="center">
  <a href="https://github.com/ShawnZhuge/aiotto/releases/latest"><strong>下载最新版</strong></a>
  ·
  <a href="https://github.com/ShawnZhuge/aiotto/issues">问题反馈</a>
</p>

## 功能一览

| 功能 | 你能得到什么 |
| --- | --- |
| 账号管理 | 一次登记并保存账号快照；集中查看 5 小时、每周或每月额度、精确重置时间和倒计时，一键切换账号 |
| 额度提醒 | 按剩余额度百分比设置提醒，达到阈值时提示切换，不用一直盯着进度条 |
| 多中转聚合 | 同时管理多个中转和模型；有 ChatGPT 账号时，官方模型和中转模型出现在同一个 Codex 模型列表 |
| 混合会话 | 在同一历史会话中切换官方模型、中转 Codex、Claude 或国产模型，处理协议差异并保留可见对话上下文 |
| 无账号使用 | 没有 ChatGPT 账号也能使用无账号模式，直接选择已经接入的中转模型 |
| 手机远程使用 | 电脑端配置一次；使用同一 ChatGPT 账号在手机上远程操作电脑端 Codex 会话时，也能选择中转模型 |
| 额度预热 | 安排并测试预热计划，查看时间冲突、下次执行和最近结果，让额度窗口更贴合工作时间 |
| macOS 状态栏 | 不打开主窗口也能查看账号额度、重置倒计时、最近会话，以及各中转的状态、协议、网络方式和延迟 |
| 会话与统计 | 管理历史会话；按官方或中转、模型和日期查看请求级 Token、缓存、延迟与折算金额 |
| 存储与诊断 | 用树图和排行定位大文件并安全清理；检查账号、中转和运行状态，需要支持时可发送脱敏诊断 |
| 其他工具 | 查看 OpenAI 服务状态、Skills、MCP、应用更新和常用维护入口 |

## 重点解决的痛点

### 1. 账号多了以后，查看余额不方便，切换也慢

多个账号的 5 小时额度、每周或每月额度和重置时间并不一致。平时要逐个登录确认，真正用到时又容易停在一个快见底的账号上。

Aiotto 把账号放在同一页：

- 账号完成一次登记后，保存为可切换的账号快照。
- 每张卡片直接显示套餐、登录状态、可用额度、精确重置时间和动态倒计时。
- 点击账号卡片即可切换，也可以快速切到下一个可用账号。
- 可按剩余额度百分比设置提醒，到达阈值时提示换号。

<p align="center">
  <img src="assets/readme-accounts.png" alt="Aiotto 账号管理：集中查看额度并快速切换账号" width="1100" />
</p>

<p align="center"><sub>账号信息已做掩码；额度、状态和切换入口保留真实界面结构。</sub></p>

### 2. 中转不该每次只能用一个，换模型也不该反复改配置

常见做法是只保存一个当前中转。要换中转或模型时，再去改地址、模型或协议。中转和模型一多，维护配置本身就成了工作。

Aiotto 会把多个中转聚合起来：

- 有 ChatGPT 账号：官方模型和多个中转模型放在同一个模型列表，需要哪个就选哪个。
- 没有 ChatGPT 账号：启用无账号使用模式，直接通过中转模型开始工作。
- 一个中转可以添加多个模型，并按模型使用 GPT、OpenAI 兼容或 Claude 协议，不必重复维护多套中转地址。
- 同一历史会话切换官方模型、中转 Codex、Claude 或国产模型时，Aiotto 会处理不兼容状态并保留可见对话上下文。
- 选中的目标不可用时会明确说明实际中转、模型和原因，不会悄悄改走官方模型或另一个中转。

选择官方模型时，官方能力仍按当前账号权益和官方服务状态使用。保存中转前可以拉取模型并做真实流式测试；添加后可查看余额、延迟、协议和网络方式。

<p align="center">
  <img src="assets/readme-relays.png" alt="Aiotto 中转管理：集中查看模型数量、协议、连接状态与延迟" width="1100" />
</p>

<p align="center"><sub>多个中转集中管理；可分别查看模型数量、协议、连接状态和延迟。</sub></p>

<p align="center">
  <img src="assets/readme-model-routing.png" alt="Codex 同一会话中切换官方 GPT、中转 Claude 与中转 GPT 模型" width="1100" />
</p>

<p align="center"><sub>同一 Codex 会话中依次使用官方 GPT、中转 Claude 与中转 GPT；右侧同时显示官方和多个中转模型。</sub></p>

| 使用场景 | 选择方式 |
| --- | --- |
| 有 ChatGPT 账号 | 官方模型、中转 A、中转 B 等同时出现在 Codex 模型列表 |
| 没有 ChatGPT 账号 | 开启无账号使用模式，直接选择中转模型 |
| 在历史会话中切换模型 | 保留可见对话上下文，并隔离不同模型不兼容的内部状态 |
| 在手机上继续电脑任务 | 电脑端由 Aiotto 管理中转；手机使用同一 ChatGPT 账号远程操作这台电脑的 Codex 会话，并从列表选择中转模型 |

手机端不需要再录入一遍中转地址和密钥。中转仍由电脑端 Aiotto 管理，手机负责远程操作同一台电脑上的 Codex 会话。

关闭智能路由后，中转模型会立即停用；如有必要，Aiotto 会在完成会话兼容处理后恢复原生官方使用方式。

## 另外几个常见麻烦

### 到了工作时间，额度窗口还没恢复好

额度预热可以按计划自动发起任务，让 5 小时额度窗口提前进入预期节奏。你可以安排多个时间、先测试计划、查看冲突与下次执行，并从最近记录确认结果。

### 每次看余额都要打开主窗口

macOS 用户可以直接在顶部状态栏查看当前及其他账号的额度、精确重置时间、动态倒计时和最近会话，也能分别查看各中转的可用状态、协议、网络方式和延迟。隐私模式隐藏敏感信息后，仍保留账号数量、当前账号和切换入口。

### 历史会话很多，Token 花在哪也说不清

会话页可以搜索、继续、置顶、归档、恢复和导出历史任务。统计页可按官方或中转、中转服务、模型和日期筛选，并查看每个请求的输入、输出、缓存、总 Token、延迟、状态和折算金额；遇到异常历史记录时，会保留可确认的数据并说明影响范围。

### 本地内容越积越多，又不敢直接清理

Aiotto 用交互式矩形树图和会话排行展示 Codex 本地存储构成、大小、占比和最近更新时间。可以先把会话移入回收站；永久清理前会创建安全备份，并保护活跃、置顶、运行中和近期会话。

### 出了问题，不知道是账号、中转还是 Codex

维护工具可以先检查账号、中转、会话和运行状态，并对可确认的问题提供安全处理入口。需要进一步支持时，可以导出或发送脱敏诊断，并获得用于后续沟通的诊断编号。

## 一个仪表盘看全局

<p align="center">
  <img src="assets/readme-dashboard.png" alt="Aiotto 仪表盘：账号、中转、会话、存储与使用趋势" width="1100" />
</p>

<p align="center"><sub>账号、额度、中转、会话、存储、Token 与成本趋势集中展示；账号信息已做掩码。</sub></p>

## 下载与安装

Aiotto 支持 macOS 12 Monterey 或更高版本，以及 Windows 10/11 x64。

### macOS

1. 打开 [最新 Release](https://github.com/ShawnZhuge/aiotto/releases/latest)。
2. 下载文件名以 `_universal.dmg` 结尾的安装包。
3. 打开 DMG，把 Aiotto 拖入“应用程序”。

首次打开可能出现系统安全提示。请先确认文件来自本项目的 GitHub Release，然后在 Finder 中右键 Aiotto，选择“打开”。如果系统仍然阻止启动，可执行：

```bash
xattr -cr /Applications/Aiotto.app
```

### Windows

1. 打开 [最新 Release](https://github.com/ShawnZhuge/aiotto/releases/latest)。
2. 下载文件名以 `Windows-x64-Setup.exe` 结尾的安装器。
3. 按安装器提示完成安装。

首次打开可能出现系统安全提示。如果 Windows 阻止启动，请选择“更多信息”，核对应用名称和下载来源后继续运行。

## 常见问题

### 没有 ChatGPT 账号也能用吗？

可以。先在 Aiotto 中添加可用的中转并完成连接测试，再开启无账号使用模式。

### 有账号时还能继续使用官方模型和官方能力吗？

可以。开启智能路由后，官方模型和中转模型会同时显示；选择官方模型时，相关能力仍按当前账号权益和官方服务状态使用。选中的中转不可用时，Aiotto 会明确提示，不会悄悄改用官方额度。

### 手机上为什么也能看到中转模型？

电脑端 Aiotto 负责管理中转。使用同一 ChatGPT 账号从手机远程操作这台电脑上的 Codex 会话时，模型列表会包含已经接入的中转模型。

### Aiotto 会要求我提交账号密码吗？

不会。请先通过 ChatGPT 或 Codex 的正常流程完成登录，再由 Aiotto 保存账号快照。不要把密码、验证码或 Cookie 发给任何第三方。

### 为什么关闭窗口后 Aiotto 还在运行？

额度提醒和路由需要在后台保持可用。关闭窗口只会隐藏主界面；需要完全退出时，请使用 macOS 状态栏或 Windows 系统托盘里的“退出 Aiotto”。

## 安全与反馈

- 不要在 Issue、截图或日志中上传账号凭据、API Key、令牌或个人信息。
- 使用第三方中转前，请自行确认其计费方式、数据处理政策和服务条款。
- 遇到问题可以通过 [GitHub Issues](https://github.com/ShawnZhuge/aiotto/issues) 提交。

项目采用 [Apache License 2.0](LICENSE)。

Aiotto 是独立的 Codex 本地工作流工具，与 OpenAI 无隶属、背书或赞助关系。

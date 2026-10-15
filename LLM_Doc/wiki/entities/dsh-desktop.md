---
type: entity
aliases: [dsh, DeepSeek Harness, dsh web]
tags: [ai, agent, electron]
applies_to: ["dsh 0.1.5-rc.1"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---
# dsh-desktop

本机自写的 Electron 插件化外壳，路径 `Music/dsh-desktop/`，用来在桌面窗口里打开 dsh（DeepSeek Harness，一个 AI agent 框架）的 web 界面。dsh 本体的仓库在 `Music/deepseek-of3d-harness`（[[来源 - Claude 全局记忆]]）。

## 要点

- **`dsh-web` 插件**负责起 dsh 后端：nvm 里的 node 24 + `apps/cli/src/bin.ts web --no-open`，端口 3080，profile `web`。
- **dsh CLI 必须用 node 24**：系统 node 是 v10，太老，`/usr/bin/npx` 跑不了 dsh / [[modlens]]。
  ```bash
  ~/.nvm/versions/node/v24.19.0/bin/node --import tsx/esm apps/cli/src/bin.ts <模式> --profile web <参数>
  ```
- **dsh 0.1.5-rc.1 起 web 首页有浏览器 cookie 认证、没有开关可关**：
  - 裸访问 `http://127.0.0.1:3080/` 回 401（`dsh web authentication required; reopen the URL printed by dsh web.`）。
  - 唯一入口是后端启动时在 stdout 打印的那行 `dsh web: http://127.0.0.1:3080/…`（URL 带一个 `token` 查询参数），访问它得到 303 + `set-cookie`。
  - 启动 token 只存在后端进程内存里，不落盘，没起那个后端的进程拿不到。
  - cookie 由持久密钥签名（dsh 的 credentials provider，按 `host:port` 绑定），后端换进程也认，默认 30 天。
  - 所以 dsh-desktop 的窗口地址取 stdout 里那条带 token 的 URL（`plugins/dsh-web/index.js` 按行抓）。附着到已有后端时，先用 `session.defaultSession.fetch` 探一下是不是 200；拿不到 token 就用 `--port 0` 自己另起一个后端。

## 用法 / 关键参数

**装 profile 插件** = 改 `~/.dsh/profiles/web/package.json` 的两处：`dependencies` 和 `dsh.profile.bundles`。

- 正路是 dsh 的 pnpm 转发器，它在安装后按已装状态核对 `bundles`：
  ```bash
  cd ~/Music/deepseek-of3d-harness
  ~/.nvm/versions/node/v24.19.0/bin/node --import tsx/esm apps/cli/src/bin.ts plugin --profile web add <包名>
  ~/.nvm/versions/node/v24.19.0/bin/node --import tsx/esm apps/cli/src/bin.ts plugin --profile web remove <包名>
  ```
- 界面里的插件市场（dshmarket）要在 dsh 里点，后端起不来时点不了；这时手改 `package.json` 那两处即可，官方错误提示也认可这种做法。

已装的 profile 插件：[[modlens]]（给文本模型加读图能力）。

## 常见问题

- [[dsh 装 agent-teams 插件后后端起不来]]

## 相关

- 实体：[[modlens]] —— 装在 web profile 里的读图插件
- 问题：[[dsh 装 agent-teams 插件后后端起不来]] —— 插件和宿主版本不兼容导致白屏
- 来源：[[来源 - Claude 全局记忆]]

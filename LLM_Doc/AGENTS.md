# LLM_Doc 维护规范

本文件写给维护这个知识库的 LLM agent（Claude Code、Codex、DeepSeek harness 等）。
每次在 `LLM_Doc/` 里工作前先读完本文件；规范本身也由用户和 agent 一起修订。

## 1. 这是什么

`CG_Human_NoteBook` 是用户亲手写的笔记库，**不使用 AI**。`LLM_Doc/` 是其中唯一由 LLM 编写的部分：
用户负责挑选资料、提问、判断；LLM 负责摘要、归类、交叉引用、标记矛盾、保持索引更新。
知识在收录时整理一次，之后持续修订，回答问题时不用每次从原始资料里重新拼。

领域：灯光渲染（Arnold、USD、OCIO）、Gaffer / Houdini / Nuke / UE 等 DCC、团队管线节点、少量图形学、使用 AI 的技巧。

## 2. 目录与读写权限

```
CG_Human_NoteBook/
├── Technical documentation/   人类笔记 —— 只读，可链接，绝不修改
├── Resource Collection/       人类整理的资料 —— 只读，可链接，绝不修改
├── README.md / 提交记录.md     人类文件 —— 不碰
└── LLM_Doc/
    ├── AGENTS.md              本文件（规范）
    ├── CLAUDE.md              只引用本文件，给 Claude Code 自动加载
    ├── README.md              给人看的一页说明
    ├── index.md               目录：每页一行
    ├── log.md                 日志：只追加
    ├── raw/                   原始资料 —— 放进来之后只读
    │   └── assets/            原始资料附带的图片
    ├── wiki/                  LLM 写的全部页面
    │   ├── entities/          实体：软件、节点、工具、插件、文件格式
    │   ├── concepts/          概念：渲染 / 图形学 / 管线概念
    │   ├── problems/          问题→方案卡片
    │   ├── sources/           来源摘要：每份原始资料一页
    │   └── syntheses/         综述、对比、问答沉淀
    └── tools/wiki_lint.py     结构检查脚本
```

- LLM 只在 `LLM_Doc/` 里创建和修改文件，且不修改 `raw/` 里已有的文件。
- **不碰 git**：不 add、不 commit、不改 `提交记录.md`，用户自己提交。
- 不改 `.obsidian/` 里的任何设置。

## 3. 原始资料

- 网页、PDF、文章：放进 `raw/`，文件名保留原标题；图片放 `raw/assets/`。
- 本机上的外部文件（`~/.claude/CLAUDE.md`、`~/gaffer/WORKLOG.md`、`~/.claude/skills/*`、各扩展包 README / WORKLOG）：
  **不复制进 `raw/`**（里面有凭据和内部地址），来源页记下绝对路径、收录日期、文件大小，之后文件更新了按差异再收录。
- `Technical documentation/`、`Resource Collection/` 由真人维护，**不作为收录来源**，不从中摘录内容。
  某个 wiki 页面的主题恰好有人类笔记时，可以在 `human_notes` 里链接过去，方便对照阅读。

## 4. 敏感信息

仓库是私有的，团队节点、管线细节可以写，但以下内容一律不进 wiki：

- 账号、密码、token、API key
- 内部 IP、内部服务网址（Confluence、cuebot、代理等）

共享盘路径（`/mnt/...`）、本机路径可以写。`tools/wiki_lint.py` 会扫一遍常见模式，但不能替代自己判断。

## 5. 页面规范

### 5.1 文件名

- 文件名就是页面标题，**整个 vault 内唯一**（Obsidian 按文件名解析 `[[链接]]`）。新建前先确认没有同名文件。
- 实体：用官方英文名，如 `Gaffer`、`ArnoldLight`、`LightSetupManager`、`OpenUSD`。
- 概念：中文名，英文名放 `aliases`，如 `运动模糊`（aliases: Motion Blur）。中文没有通用译名的保留英文，如 `AOV`、`OCIO`。
- 问题卡片：一句话描述现象，带软件名，如 `Gaffer Animation 关键帧设置后场景不动`。
- 来源页：`来源 - <原标题或文件名>`，如 `来源 - Claude 全局记忆`。
- **文件名不能以 `.md`、`.png` 这类扩展名结尾**：Obsidian 会把 `[[xxx.md]]` 当成带扩展名的路径，链接失效。
  原资料是文件时去掉扩展名再起名。文件名也不能含 `* " \ / < > : | ? # ^ [ ]`。
- 综述页：直接写主题，如 `Gaffer 1.6 与 1.7 API 差异`。

### 5.2 frontmatter

每页开头都有，字段不能少（没有内容写空列表）：

```yaml
---
type: entity        # entity | concept | problem | source | synthesis
aliases: []         # 别名，含英文名 / 中文名
tags: []            # 领域标签，如 gaffer、arnold、usd、lighting
applies_to: []      # 适用的软件版本，如 "Gaffer 1.6.5.1"、"Gaffer 1.7.1.0"；与版本无关写 []
sources: []         # 支撑本页的来源页，如 "[[来源 - Claude 全局记忆]]"
human_notes: []     # 相关的人类笔记，如 "[[如何在Gaffer中测量距离]]"
status: active      # active | disputed（有未解决的矛盾）| stale（已被新资料取代）
created: 2026-10-15
updated: 2026-10-15
---
```

来源页额外加 `origin:`（外部文件绝对路径或网址）和 `ingested:`（收录日期）。

### 5.3 正文结构

**实体页**
```markdown
# <名字>
一两句话说明它是什么、在哪用。
## 要点
## 用法 / 关键参数
## 常见问题        ← 列出相关问题卡片的链接
## 相关            ← 双向链接区，见 §6
```

**概念页**
```markdown
# <名字>
## 定义
## 在各软件里的对应   ← 如 Gaffer 的哪个节点、Arnold 的哪个参数
## 注意事项
## 相关
```

**问题卡片**
```markdown
# <现象>
## 现象
## 原因
## 解决
## 验证方法
## 相关
```

**来源页**
```markdown
# 来源 - <标题>
## 摘要
## 收录到的页面    ← 本次新建或修改的所有页面
## 未收录的内容    ← 跳过了什么、为什么（敏感、过时、超出领域）
```

**综述页**：自由结构，但必须有 `## 相关`，结论处用 `[[链接]]` 注明依据。

### 5.4 写作规则

- 中文正文；专有名词、代码、节点名、插口名保留英文。
- 每条事实能追到来源：页面级写在 `sources`，单条关键事实在句末加 `（[[来源 - xxx]]）`。
- 写当前的正确做法，不写「以前是…后来改成…」的经过；版本差异写成并列的两条，各自标版本。
- 不用「不是…而是…」这类对比句式，不加总起和总结句，不用「落地 / 对齐 / 钉死」这类行话。
- 代码块标语言；命令写完整，能直接复制运行。

## 6. 双向链接

用户要求**所有 wiki 页面之间的链接都是双向的**：

- A 的正文或 `## 相关` 里链接了 B，B 的 `## 相关` 里也必须有 A。
- 新建或修改页面时，顺手打开每个被链接的页面补上回链。
- `## 相关` 按类型分行，每条后面跟一句关系说明：
  ```markdown
  ## 相关
  - 实体：[[Gaffer]] —— 所属软件
  - 问题：[[Gaffer Animation 关键帧设置后场景不动]] —— 时间单位是秒
  - 来源：[[来源 - Claude 全局记忆]]
  ```
- 例外：指向 `Technical documentation/`、`Resource Collection/`、`raw/` 的链接是单向的（不能改人类文件和原始资料），记在 `human_notes` / `sources` 里即可。
- `index.md`、`log.md` 不计入双向检查。

## 7. 矛盾与过时

- 两份来源说法不一致：两种说法都写进页面，加 callout，`status` 改成 `disputed`：
  ```markdown
  > [!warning] 矛盾
  > [[来源 - A]] 说 X（Gaffer 1.6.5.1 实测）；[[来源 - B]] 说 Y（未注明版本）。待确认。
  ```
- 确认之后删掉 callout，保留正确说法和依据，`status` 改回 `active`，在 `log.md` 记一条 `resolve`。
- 被新资料完全取代的页面标 `stale`，正文开头链接到取代它的页面；不删除，除非用户要求。

## 8. 工作流程

### 8.1 收录（ingest）

用户的节奏是**先批量收录，之后靠提问找矛盾再修改**。每份资料：

1. 读完原始资料，建来源页。
2. 拆出实体、概念、问题→方案；已有页面就合并进去（更新 `updated`、`sources`），没有就新建。
3. 和已有页面说法冲突的，按 §7 标出来，不要自己挑一个覆盖掉。
4. 补齐所有双向链接。
5. 更新 `index.md`。
6. 在 `log.md` 追加一条。

一批收完运行 `python3 LLM_Doc/tools/wiki_lint.py`，把报告里的问题修到零，再向用户汇报：新建了几页、改了几页、标出了哪些矛盾。

### 8.2 提问（query）

1. 先读 `index.md` 找相关页面，再读页面；页面不够再回到原始资料。
2. 回答里用 `[[页面]]` 标出依据。
3. 回答有长期价值（对比、分析、新发现的联系）就存成 `syntheses/` 下的页面，并补双向链接、更新 index、记 log。
4. 提问中发现的矛盾或错误，直接改对应页面（按 §7），在 log 里记 `fix` 或 `resolve`。

### 8.3 体检（lint）

1. 运行 `python3 LLM_Doc/tools/wiki_lint.py`：断链、缺回链、孤立页、未进 index、frontmatter 缺字段、疑似敏感信息、`disputed` 页清单。
2. 人工检查脚本查不出的：页面间说法矛盾、被新版本取代的结论、正文反复提到却没有独立页面的概念、可以补充的资料。
3. 结果记一条 `lint` 日志。

## 9. index.md 与 log.md

**index.md** 按类型分节，每页一行，一句话说明：

```markdown
## 实体
- [[Gaffer]] —— 开源节点式灯光 / 渲染 / 管线工具
```

**log.md** 只追加，不改旧条目。每条以固定格式开头，便于 `grep "^## \[" log.md | tail -5`：

```markdown
## [2026-10-15] ingest | 来源 - Claude 全局记忆
新建 12 页、修改 3 页；标出矛盾 1 处：[[xxx]]。
```

操作类型：`init`、`ingest`、`query`、`lint`、`fix`、`resolve`、`schema`（修改本文件）。

## 10. 搜索

当前只靠 `index.md` + `grep`。页面数量上来、index 读起来吃力时，再和用户商量换本地搜索工具。

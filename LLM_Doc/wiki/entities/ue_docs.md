---
type: entity
aliases: [UE 官方文档离线副本]
tags: [unreal, docs]
applies_to: ["Unreal Engine 5.8"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---
# ue_docs

[[Unreal Engine]] 5.8 英文官方指南的离线副本，路径 `Music/third_party/unreal/ue_docs/`：3628 篇 Markdown、42MB 纯文本、1225 段完整代码，含 Node Reference 1097 页，抓取零失败。重建流程和坑位写在包内 README（[[来源 - Claude 全局记忆]]）。

## 要点

- **为什么要抓在线文档**：UE 源码检出里几乎没有成文文档。
  - `Engine/Documentation/` 的 678 个 `.udn` 里有 526 个是编辑器悬停提示（`Shared/Types`，`Availability: NoPublish`）。成文的只有 `Source/Programming` 下 4 篇：UnrealBuildTool 的 Target / Module / BuildConfiguration 属性表和 BuildGraph 任务表，它们就是在线同名页的生成源（本地 551 条属性比在线更全）。
  - 唯一完整的一块是 Horde：`Engine/Source/Programs/Horde/Docs/` 107 个 md，和线上一一对应。
  - C++ / 蓝图 / Python API 参考在线是从头文件注释生成的，但仓库里没有 Doxyfile，UE5 也没有发布 UnrealDocTool。
  - 在线那 21 个大专题（渲染、Niagara、动画、蓝图、Gameplay 框架、打包发布等）仓库里一个字都没有。
- 只抓了英文版：抽查 Lumen 一页，中文正文只有英文的一半。
- 还没做：Python API 存根（要在远程 Windows 的 UE 里用 PythonScriptPlugin 开发者模式导出）。

## 用法 / 关键参数

```bash
cd Music/third_party/unreal/ue_docs
python3 search.py <关键词>        # 全文搜
python3 search.py -t <关键词>     # 只搜标题
python3 search.py -s <章节> <关键词>   # 限定章节
grep -rl "<关键词>" docs/
```

也可以用上一层的统一入口 `python3 ue.py <关键词>`，同时查文档和 [[ue_api]]。

## 站点接口（自己挖的，无公开文档）

| 接口 | 内容 |
|---|---|
| `table_of_content.json` | 目录树 |
| `document.json` | 单页正文，结构化 block 数组（15 种块） |
| `snippets/snippet.json?id=&signature=` | 代码片段全文 |
| `…/documentation/image/<key>` | 图片 |

页面是 Angular 应用，没有 `__NEXT_DATA__`；接口靠浏览器里 `performance.getEntriesByType('resource')` 和 grep 站点的 `main.*.js` 找出来。

## 抓取要点

- **一律在浏览器页面上下文里 `fetch`**（CDP `Runtime.evaluate` + `Promise.all`），用浏览器自己的 TLS 指纹和 cookie；2 并发、批间隔 1 秒。外部 `urllib` 带同样的 cookie 和 UA，抓到 2336 页被整批拦截。
- **403 有两种**：`cf_clearance` 被作废（响应体含 `cf_chl`）时光重取 cookie 没用，要让浏览器真导航一次文档页重新过挑战；按速率的限流是 429。
- **限流期间浏览器打开页面照样 200**（页面自己那次请求成功，手发同一 URL 是 429）。判断限流是否解除要单发 API 请求试探。
- **Node Reference 的 slug 带斜杠**（`node-reference/ControlRig/Absolute`），直接当文件名会被当成子目录，要转义。
- **代码块的 `code_preview` 是截断的**（28 行只给 11 行），全文要用 `url_signature` 单独取，签名约一天过期，正文抓完要马上补代码。
- **改过名的页面**：旧 slug 返回 302，跳转目标在响应体的 `{"redirect_url": …}` 里（没有 Location 头），fetch 不会自动跟，共 25 页。

## 相关

- 实体：[[Unreal Engine]] —— 文档所属软件
- 实体：[[ue_api]] —— 配套的 C++ 反射索引，和文档冲突时以它为准
- 来源：[[来源 - Claude 全局记忆]]

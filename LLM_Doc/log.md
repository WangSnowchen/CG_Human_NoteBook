# 日志

只追加，不改旧条目。查最近几条：`grep "^## \[" log.md | tail -5`

## [2026-10-15] init | 建立知识库框架
按 Karpathy LLM Wiki 模式建立目录、`AGENTS.md` 规范、`index.md`、`log.md`、`tools/wiki_lint.py`。
定下的约定：只写 `LLM_Doc/`、人类笔记只读可链接、原始资料放 `raw/`、页面分实体 / 概念 / 问题→方案 / 来源 / 综述五类、wiki 页面之间链接必须双向、先批量收录再靠提问找矛盾、git 由用户提交。

## [2026-10-15] schema | 人类笔记不作为收录来源
`Technical documentation/`、`Resource Collection/` 由真人维护，不从中摘录内容，只在主题相关时用 `human_notes` 链接过去。

## [2026-10-15] ingest | 来源 - Claude 全局记忆
新建 155 页：实体 54、概念 20、问题→方案 58、综述 22、来源 1。按内容分六组并行整理，跨组回链统一补齐，`wiki_lint.py` 0 错误。
没有标 `disputed` 的页面；原文内部不一致的 6 处按较新的说法写，记在 [[来源 - Claude 全局记忆]] 的「收录时的补充与存疑」。
有 4 处示意代码没有实际运行过，页面上标了「示意」。

## [2026-10-15] schema | 文件名不能以扩展名结尾
来源页原名以 `.md` 结尾，Obsidian 会当成扩展名解析，全部链接失效；改名为 `来源 - Claude 全局记忆`，规则写进 AGENTS.md §5.1。

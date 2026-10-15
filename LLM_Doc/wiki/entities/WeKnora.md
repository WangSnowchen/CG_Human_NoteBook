---
type: entity
aliases: [WeKnora Lite, 腾讯知识库]
tags: [ai, rag, knowledge-base]
applies_to: []
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---
# WeKnora

腾讯开源的知识库 / RAG 系统。本机部署的是 **Lite 单二进制版**：一个 Go 进程，存储用 SQLite FTS5 + sqlite-vec，不依赖任何外部服务。本机没有 Docker，Lite 是唯一可行的形态。部署说明在 `Music/Docs/weknora/DEPLOY.md`，改它之前先读（[[来源 - Claude 全局记忆]]）。

## 要点

- **只能从源码编译**：v0.5.1～v0.8.0 所有 GitHub Release 的附件都是空的。源码取只读检出 `_repos/Tencent/WeKnora`，导出到 `_scratch/weknora-build/` 编译。
- **DuckDB 预编译静态库和本机 C++ 运行库不匹配**：它用 GCC 11 编译，本机 GCC 9.4 / libstdc++ 6.0.28 缺 3 个符号——`__throw_bad_array_new_length`、无参的 `string::reserve`、`exception_ptr::_M_addref/_M_release`。前两个自己写 shim 补；后两个从 `gcc -print-file-name=libstdc++.a` 里抽出来；链接时用 `-Wl,--undefined=` 预先声明（静态库按需抽取，不预声明抽不到），libstdc++ 混合静态 / 动态链接。
- **启动时会联网装 DuckDB 扩展**，本机直连不通会永久卡住，见 [[WeKnora 启动卡住不监听端口]]。
- 当前**没有配置任何模型**，问答功能不可用属正常；用户之后自己接云端 LLM。

## 用法 / 关键参数

```bash
cd ~/Music/Docs/weknora && ./start.sh   # 打开 http://localhost:8080
pkill -f WeKnora-lite                    # 停止
```

- 必须在 `Music/Docs/weknora/` 下启动：config、migrations、web、data 都按当前目录的相对路径解析。
- 机器重启后不会自动拉起，要手动启动。
- 应急开关 `DUCKDB_SKIP_EXTENSION_LOAD=1` 跳过扩展加载，代价是 xlsx / xls 不能解析。

## 常见问题

- [[WeKnora 启动卡住不监听端口]]

## 相关

- 问题：[[WeKnora 启动卡住不监听端口]] —— DuckDB 扩展下载卡死
- 实体：[[Music 测试实验室]] —— 部署目录和源码检出所在
- 来源：[[来源 - Claude 全局记忆]]

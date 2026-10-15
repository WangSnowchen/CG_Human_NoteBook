---
type: problem
aliases: [DuckDB INSTALL hang, WeKnora startup hang]
tags: [ai, rag, duckdb, network]
applies_to: ["DuckDB 1.5.2"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---
# WeKnora 启动卡住不监听端口

## 现象

`./start.sh` 启动 [[WeKnora]] 后进程一直在，但 8080 端口不监听，进程 CPU 占用为 0，日志没有报错。

## 原因

启动时 `NewDuckDB()` 执行 `INSTALL spatial` / `INSTALL excel`，要从 `extensions.duckdb.org` 下载 DuckDB 扩展。本机直连这个站点超时，而 **DuckDB 的 C++ HTTP 客户端不读 `http_proxy` 环境变量**，设了代理也没用，下载永远挂着（[[来源 - Claude 全局记忆]]）。

## 解决

用 curl 经内网代理把两个扩展预先下载到 DuckDB 的本地扩展目录，之后 `INSTALL` 发现已存在就直接跳过：

```bash
DIR=~/.duckdb/extensions/v1.5.2/linux_amd64
mkdir -p $DIR
for ext in spatial excel; do
  curl --proxy <内网代理> -L -o $DIR/$ext.duckdb_extension.gz \
    http://extensions.duckdb.org/v1.5.2/linux_amd64/$ext.duckdb_extension.gz
  gunzip -f $DIR/$ext.duckdb_extension.gz
done
```

临时绕过可以设 `DUCKDB_SKIP_EXTENSION_LOAD=1` 启动，代价是 xlsx / xls 文件不能解析。

## 验证方法

```bash
ss -tlnp | grep 8080
```

有监听，浏览器能打开 `http://localhost:8080`。

## 相关

- 实体：[[WeKnora]] —— 出问题的服务
- 来源：[[来源 - Claude 全局记忆]]

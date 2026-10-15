---
type: problem
aliases: [generator didn't stop after throw]
tags: [python]
applies_to: []
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---
# contextmanager 里 yield 包 try 报 didn't stop after throw

## 现象

用 `@contextlib.contextmanager` 写的上下文管理器（例如「把一次操作包进撤销组」），`with` 块里一出错，报的是：

```text
RuntimeError: generator didn't stop after throw()
```

真正的错误信息被顶掉了，看不出 `with` 块里哪里出错。

## 原因

`with` 块里抛的异常会被 throw 回生成器的 `yield` 处。如果 `yield` 被 `try/except` 包住，`except` 接住异常后函数继续往下走，又执行到第二个 `yield`（或在 except 里 `yield`），生成器没有结束，`contextlib` 就报这个错（[[来源 - Claude 全局记忆]]）。

```python
@contextlib.contextmanager
def undoGroup(name):
    begin(name)
    try:
        yield
    except Exception:
        cancel()
        yield          # 第二次 yield，触发错误
    end()
```

## 解决

收尾放进 `finally`，需要区分成败时 `except` 里重新抛出，生成器里只 `yield` 一次：

```python
@contextlib.contextmanager
def undoGroup(name):
    begin(name)
    try:
        yield
    finally:
        end()
```

## 验证方法

写一个 `with undoGroup("x"): raise ValueError("boom")` 的测试，确认抛出的是 `ValueError: boom`。

## 相关

- 实体：[[nuke_mcp]] —— 撤销组第一版这么写，一次挂了 10 个断言
- 综述：[[DCC MCP 桥接架构]] —— 派发层把工具调用包进撤销组
- 来源：[[来源 - Claude 全局记忆]]

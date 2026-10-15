---
type: problem
aliases: [pyc 缓存热加载失效, exec_module stale bytecode]
tags: [python, hot-reload, mcp]
applies_to: []
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# Python 热加载读到旧字节码

## 现象

工具目录按文件修改时间热加载：改了一个工具文件、存盘后重新加载，运行的仍是改之前的代码。时好时坏，快速连续修改时最容易出现。

## 原因

用 `importlib` 的 `spec.loader.exec_module()` 加载时，Python 用 `__pycache__` 里的 pyc 判断源文件是否变化，判断依据只有「源文件 mtime 的**整数秒** + 文件大小」。同一秒内改成同样大小的内容（例如只改一个数字），pyc 被认为仍然有效，加载的是旧字节码。

## 解决

热加载器自己读源码、`compile()` + `exec()` 进模块字典，不经过 pyc 缓存：

```python
import types

def loadToolFile( path, moduleName ) :
    with open( path, encoding = "utf-8" ) as f :
        source = f.read()
    module = types.ModuleType( moduleName )
    module.__file__ = path
    exec( compile( source, path, "exec" ), module.__dict__ )
    return module
```

变化检测用自己的指纹（mtime + size，必要时加内容哈希），单个文件加载失败只记录错误、不影响其他文件。

## 验证方法

写测试：同一秒内把工具文件改成等长的不同内容，重新加载后断言新行为生效。

## 相关

- 实体：[[gaffer_mcp]] —— loader 按此方式实现
- 实体：[[houdini_mcp]] —— 照搬同一套热加载
- 实体：[[nuke_mcp]] —— 照搬同一套热加载
- 综述：[[DCC MCP 桥接架构]] —— 工具文件统一用 compile + exec 加载
- 来源：[[来源 - Claude 全局记忆]]

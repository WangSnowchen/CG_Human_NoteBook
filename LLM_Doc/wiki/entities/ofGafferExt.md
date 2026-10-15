---
type: entity
aliases: [gaffer_custom_extensions, 本地扩展框架, localExtensions]
tags: [gaffer, extension, pipeline]
applies_to: ["Gaffer 1.7.1.0"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# ofGafferExt

团队给 [[Gaffer]] 做的扩展开关框架：公司扩展和个人本地扩展都通过它按配置加载，GUI 里有一个开关面板。Python 模块名 `ofGafferExt`（[[来源 - Claude 全局记忆]]）。

## 要点

- 框架本体：`/mnt/centralizedRepo/third_party/gaffer/gaffer_custom_extensions/0.1.0/`，其中 `_core/` 是框架、`extensions/` 是公司扩展、`_local/` 是本地扩展加载器钩子与骨架。
- 本地扩展放 `~/gaffer/localExtensions/<目录名>/`；开关面板在 `Tools > Custom Extensions...`；配置文件 `~/gaffer/customExtensions/user_config.json`。
- **扩展键只能由目录名推导**：`loader.py` 里 `key = ofGafferExt.LOCAL_PREFIX + dirName.strip().lower()`，`LOCAL_PREFIX = "local:"`。目录 `faceSelection` 的键是 `local:faceselection`。
- `enabled( name )` 默认 False（失败即关闭）；优先级 `envOverride` > `readConfig`；`localExtensionsAllowed()` 为假时本地键一律 False。`readConfig()` 不缓存，每次重读文件。
- 加载器有三条跳过路径，`if not enabled( key ) : continue` 是其中唯一不给警告的一条。
- `startup/gui/` 里的钩子只在 GUI 上下文执行；`bin/gaffer env python` 不跑 gui 启动脚本，本地扩展在那里本来就加载不到。
- 扩展目录的 `python/` 会被加进 PYTHONPATH，`python/` 底下可以放多个顶层包。`localExtensions/*.zip` 是手工分发件，加载器只读目录。

## 用法 / 关键参数

- **写配置走框架自己的 `ofGafferExt.writeConfig( states )`**：整文件覆盖、先写 `.tmp` 再 `os.replace` 原子替换。不手改 JSON，手打的键差一个字母就对不上。
- startup 钩子两条硬要求：

```python
import ofGafferExt

if ofGafferExt.enabled( "<目录名>" ) :
    # 导入、注册扩展
    ...
    ofGafferExt.registerLoaded( "<目录名>" )
```

用 `if` 包住，不用 raise / return 提前退出（否则「被用户关掉」会显示成「扩展出错」）；少了 `registerLoaded`，面板会显示加载失败。

- 骨架文件 `extension.py`、`startup/gui/`、`README.md`、`PROMPT.md` 是本地扩展自己的；从 rez 包同步代码时只拷 `python/`，`graphics/` 也要跟着拷（图标名按 `Tool.typeName()` 推，缺文件时 `GafferUI.Image` 抛出异常，整个 Viewer 工具条建不出来）。
- 测本地扩展时关掉同名 rez 包，测 rez 包时用 `GAFFER_EXTENSIONS_DISABLE=local:<键>` 关掉本地那份（不要把 rez 包对应的名字也写进去）。

## 常见问题

- [[ofGafferExt 本地扩展显示启用但没加载]]
- [[改了 rez 包但运行的还是本地扩展副本]]

## 相关

- 实体：[[Gaffer]] —— 宿主软件
- 实体：[[rez]] —— 同一份扩展常以 rez 包和本地扩展两种形式并存
- 实体：[[gaffer_network_editor]] —— 以本地扩展形式日常使用
- 实体：[[gaffer_parameter_editor]] —— 以本地扩展形式日常使用
- 实体：[[gaffer_indexed_mesh]] —— 以本地扩展形式日常使用
- 实体：[[cueMonitor]] —— 以本地扩展形式日常使用
- 问题：[[ofGafferExt 本地扩展显示启用但没加载]] —— 手打扩展键导致静默跳过
- 问题：[[改了 rez 包但运行的还是本地扩展副本]] —— 两份副本打同一个模块名
- 问题：[[Gaffer 视口展开大场景内存暴涨]] —— 本地扩展 `local:defaultvalues` 设定计算缓存上限
- 综述：[[Gaffer 无头测试与截图验证方法]] —— 确认跑的是哪一份代码
- 来源：[[来源 - Claude 全局记忆]]

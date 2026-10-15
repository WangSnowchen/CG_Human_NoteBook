---
type: problem
aliases: [localExtensions 副本未同步, 两份副本同一模块名]
tags: [gaffer, extension, rez, pipeline]
applies_to: ["Gaffer 1.7.1.0"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# 改了 rez 包但运行的还是本地扩展副本

## 现象

修改 `Music/third_party/gaffer_my_extensions/<包>/` 里的代码，测试全部通过；用户用日常方式启动 Gaffer，问题依旧，traceback 指向 `~/gaffer/localExtensions/<扩展>/python/...` 里的旧文件。

## 原因

同一份扩展有两份副本、提供同一批模块名：rez 包 `gaffer_my_extensions` 下一份，[[ofGafferExt]] 本地扩展 `~/gaffer/localExtensions/<扩展>/` 下一份。日常启动命令（`rez-env pj2023dy001 python==3.11 gaffer==1.7.1.0 -- gaffer`，启动器 `Music/launcher/gaffer_pj2023dy001_1710.sh`）不带 `gaffer_my_extensions`，rez 包根本不加载，跑的是本地扩展。本地那份如果没同步，就停在旧版本。

另一个变体：本地扩展已在开关面板里启用时，Gaffer 启动时已把它的模块导入 `sys.modules`，探测脚本里再 `sys.path.insert` 源包路径也没用，量到的还是本地那份。

## 解决

1. 改完 rez 包，把 `python/` 下的模块整个拷进 `~/gaffer/localExtensions/<扩展>/python/`（需要时连 `graphics/` 一起拷）。`extension.py`、`startup/gui/`、`README.md` 是本地骨架，不覆盖。
2. 覆盖前逐文件 diff，确认本地独有的行都是被新版本取代的旧内容。
3. 用户 Gaffer 正在运行、映射着旧的 `.so` 时，先拷成 `.new` 再 `mv` 替换。
4. 测某一份时把另一份关掉：测 rez 包用 `GAFFER_EXTENSIONS_DISABLE=local:<键>` + `GAFFER_EXTENSION_PATHS` 加包路径；测本地扩展时关掉同名 rez 包。

## 验证方法

在 screengrab 命令文件里打印 `sys.modules["<模块>"].__file__`，确认路径是期望的那份；再真实创建一次出问题的对象（例如 `GafferUI.Editor.create( "NetworkEditor", script )`）。

## 相关

- 实体：[[ofGafferExt]] —— 本地扩展框架
- 实体：[[rez]] —— rez 包的加载方式
- 实体：[[gaffer_network_editor]] —— 实际踩到这一问题的扩展
- 实体：[[gaffer_parameter_editor]] —— 同样有两份副本
- 实体：[[gaffer_indexed_mesh]] —— 本地 `.so` 排在 rez 包前，对照时容易量错版本
- 实体：[[cueMonitor]] —— 同样有 rez 包和本地扩展两份副本
- 问题：[[ofGafferExt 本地扩展显示启用但没加载]] —— 另一类「改了没生效」
- 问题：[[自制节点图编辑器在 Gaffer 1.7 下建不出来]] —— 修好后启动仍报同一个错就是这个原因
- 综述：[[Gaffer 无头测试与截图验证方法]] —— 先确认量的是哪一份代码
- 来源：[[来源 - Claude 全局记忆]]

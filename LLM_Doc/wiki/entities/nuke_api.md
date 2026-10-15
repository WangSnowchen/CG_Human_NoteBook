---
type: entity
aliases: [Nuke API 整合包]
tags: [nuke, docs, api]
applies_to: ["Nuke 16.1v2"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---
# nuke_api

从本机 [[Nuke]] 16.1v2 生成的离线 API 与文档整合包，路径 `Music/third_party/nuke/nuke_api/`（约 48MB，不分版本）。[[nuke_mcp]] 的文档类工具读它；查 Nuke API 时先翻这里（[[来源 - Claude 全局记忆]]）。

## 要点

| 目录 | 内容 |
|---|---|
| `docs/` | 16 个语料共 3312 页纯文本（原始 922MB HTML + 300MB 截图压到 13.3MB）。最有用的是 `nodes` 495 页节点参考，每页带「界面标签 / 脚本 knob 名 / 默认值 / 说明」表 |
| `reference/` | 在 Nuke 里自省出来的 JSON：620 个验证过能创建的节点类、每个类的 knob 全表、`nuke` / `nukescripts` 的 API 和 docstring |
| `include/` | NDK 头文件 711 个 |
| `examples/` | 官方示例 |

- 节点类清单靠「插件列表 + 内置清单 + 文档页名反推 + 真建一遍验证」得到。`nuke.plugins()` 单独用会漏掉编进 `libDDImage.so` 的内置节点（如 `Blur`）。
- 旧的 `nuke14.0v6/`、`nuke15.0v5/` 目录（各约 250MB，是安装目录 `Documentation/` 的原样拷贝）已删，需要时可从 `/usr/local/Nuke14.0v6/Documentation`、`/usr/local/Nuke15.0v5/Documentation` 重新生成。

## 用法 / 关键参数

重建脚本在 `_build/`：

| 脚本 | 作用 |
|---|---|
| `extract_docs.py` | 把安装目录的 HTML 文档抽成纯文本 |
| `dump_reference.py` | 在 Nuke `-t` 下自省节点类和 knob |
| `write_manifest.py` | 生成清单 |

具体命令写在包的 README。`dump_reference.py` 要做成可续跑：少数插件构造时建 QWidget，在 `-t` 下直接 core dump，脚本要把正在处理的类写进文件并 fsync，重跑时跳过上次崩溃的那个。参数通过环境变量传，见 [[Nuke -t 模式传不进带值的脚本参数]]。

## 相关

- 实体：[[Nuke]] —— 数据来源
- 实体：[[nuke_mcp]] —— 文档工具读这份数据
- 问题：[[Nuke -t 模式传不进带值的脚本参数]] —— 重建脚本的传参方式
- 来源：[[来源 - Claude 全局记忆]]

---
type: entity
aliases: [GafferNoise, GafferNoiseUI]
tags: [gaffer, custom-node, rez]
applies_to: ["Gaffer 1.7.1.0"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# gaffer_custom_node

自用的高级 Gaffer 节点合集，rez 包，只支持 Gaffer 1.7（`requires = gaffer-1.7+`）。节点都挂在 Tab 菜单 `/Noise` 下，类型名形如 `GafferNoise::<Node>`。

```text
Music/third_party/gaffer_my_extensions/gaffer_custom_node/0.1.0/
```

已在总控包 `gaffer_my_extensions` 的 `config.json` 的 `enabled` 里。加新节点前先读包 README 的「加一个 Python 节点 / Box 节点」。

## 要点

- **目录布局照 Gaffer 自带模块**：
  - `python/GafferNoise/`：节点实现，不 import GafferUI。
  - `python/GafferNoiseUI/`：元数据和菜单。
  - `startup/gui/GafferNoise.py`：调用 `GafferNoiseUI.NodeMenu.install( application )`。
- **已收的节点**：
  - [[MeasureDistance]]：`/Noise/Scene/Measure Distance`，Box 节点。
  - [[MeshAttributeCollector]]：`/Noise/Scene/Mesh Attribute Collector`，Python ComputeNode。
  - 两个节点原来各自的包（`gaffer_measure_distance`、`gaffer_mesh_attribute_collector`）已从总控 `_available` 去掉，目录还在。
- **外形规矩**：节点上只留场景入口和出口，其余插口 `nodule:type=""`；Box 四边的加号按钮 `noduleLayout:customGadget:addButton{Top,Bottom,Left,Right}:visible=False`。Box 插口的 `nodule:type` 只在提升时复制给内部 BoxIO（`BoxIO::setup`），事后改它不影响内部连线。

## 用法 / 关键参数

### 加一个 Python 节点

1. `GafferNoise/<Node>.py`：**文件名必须等于类名**，存盘时才会写成 `GafferNoise.<Node>()`。
2. `GafferNoise/__init__.py` 加 `from .<Node> import <Node>`。
3. `GafferNoiseUI/<Node>UI.py`：`Gaffer.Metadata.registerNode(...)` + `NodeMenu.append( "Scene/显示名", 类 )`（路径相对 `/Noise`）。
4. `GafferNoiseUI/__init__.py` 加 `from . import <Node>UI`。

写 ComputeNode 的注意事项见 [[Gaffer Python ComputeNode 调基类 hash 报错]]。

### 加一个 Box 节点

- `.grf` 放 `GafferNoise/boxes/`，菜单用 `NodeMenu.appendBox( path, "X.grf" )`。
- `.grf` 必须是 **Export Reference 格式**（文件内容是 Box 的内部，`parent` 就是 Box）。「整个脚本」格式（`parent.addChild( Box )`）要先在 Gaffer 里加载，再 `box.exportForReference( 路径 )` 转一次。

### 启动与测试

- 日常启动器 `gaffer_pj2023dy001_1710.sh` 不带 `gaffer_my_extensions`，要看到本包用：

  ```bash
  rez-env pj2023dy001 python==3.11 gaffer==1.7.1.0 gaffer_my_extensions -- gaffer
  ```

- 测试 `tests/run_tests.sh`：无头 24 条 + screengrab 10 条。screengrab 里要自己建 GraphEditor（`~/gaffer/startup/screengrab/layouts.py` 在 1.7 下布局为空）。
- 测试夹具里手加的 NameValuePlug 要带 `Dynamic` 标志，否则存盘回读报 "not a child"。
- `GafferUI.info` 在 1.7 不存在。

## 常见问题

- [[Gaffer Python ComputeNode 调基类 hash 报错]]
- [[Gaffer 自写 PlugValueWidget 一直空白]]
- [[Gaffer .grf 回读报 is not a child]]

## 相关

- 实体：[[MeasureDistance]] —— 包内的 Box 节点
- 实体：[[MeshAttributeCollector]] —— 包内的 Python 节点
- 实体：[[rez]] —— 打包与启动方式
- 实体：[[Gaffer screengrab]] —— 包的界面测试手段
- 问题：[[Gaffer Python ComputeNode 调基类 hash 报错]] —— 写 Python 节点的注意事项
- 问题：[[Gaffer 自写 PlugValueWidget 一直空白]] —— 写自定义参数控件的注意事项
- 问题：[[Gaffer .grf 回读报 is not a child]] —— Dynamic 标志
- 综述：[[Gaffer Box 处理器脚手架]] —— Box 节点的通用结构
- 综述：[[Gaffer 1.6 与 1.7 API 差异]] —— 本包只支持 1.7，Python ComputeNode 按 1.7 写
- 来源：[[来源 - Claude 全局记忆]]

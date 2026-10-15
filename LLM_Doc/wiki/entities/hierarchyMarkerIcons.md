---
type: entity
aliases: [HierarchyView 类型图标, 层级视图自动图标]
tags: [gaffer, gafferui, hierarchyview, usd]
applies_to: ["Gaffer 1.6.5.1"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# hierarchyMarkerIcons

用户自制的 [[Gaffer]] 扩展：HierarchyView 每一行按该位置的对象类型自动显示一个 16x16 类型图标。免配置，没有任何手动设置入口（[[来源 - Claude 全局记忆]]）。

## 要点

- 文件：`~/gaffer/python/hierarchyMarkerIcons.py` + `startup/gui/hierarchyMarkerIcons.py`。
- **接入**：模块自己的 `_MarkerIconColumn`（名字 + 图标）是 [[Gaffer PathColumn]] 的 Python 子类，`install()` 把 HierarchyView 的 Name 列换成它，patch 幂等。
- **图标管线**：图标统一 16x16，生成到 `~/gaffer/graphics/`，`install()` 时 prepend 进 `GAFFERUI_IMAGE_PATHS`。用户提供的 svg 用 QtSvg 转 png；`StandinShelf.png` 缩放成 `typeProcedural.png`，官方 `cameraOn` 缩放成 `typeCamera`。**不能占用官方图标名**：`GAFFERUI_IMAGE_PATHS` 全局查找，同名会劫持 Gaffer 其它界面上的图标。官方图标尺寸本来就不统一（25 / 16 / 14）。

## 类型映射（`scene.object().typeName()`）

| 对象类型 | 图标 |
|---|---|
| `MeshPrimitive` | `mesh.png` |
| `PointsPrimitive` | `points.png` |
| `CurvesPrimitive` | `basiscurves.png` |
| `IECoreVDB::VDBObject` | `volume.png` |
| `CoordinateSystem` | `coordsys.png` |
| `SpherePrimitive` | sphere |
| `ExternalProcedural` | `typeProcedural.png` |
| `Camera` | `typeCamera.png` |
| `GafferScene::Capsule` | `capsule.png` |
| `ClippingPlane` | `clip.png` |
| `NURBSPrimitive` | `nurbs.png` |
| `NullObject` 且是灯光 | 按灯光类型 `*Light.png` / `*Blocker.png` |
| `NullObject` 无灯光但有 `ai:volume` 属性 | `volume.png` |
| 其余（含空位置、Group、只有自定义属性） | `scope.png` |

- 灯光判断逐行照 LightEditor 源码：遍历 `light` / `*:light` / `lightFilter` / `*:lightFilter` 属性 → `ShaderNetwork` → 读 shader 元数据 `type`（缺失就 continue）；`type=lightBlocker` 时读 `typeParameter` 指向的 shader 参数得到 `*Blocker.png`；多个匹配取最后一个。元数据 `type` 依赖 shader 注册，内置灯光可能查不到，要保留按 shader 名关键字（spot / point / dome / disk …）的兜底。
- `DiskPrimitive` / `PatchMeshPrimitive` 没配图标，保持空。`Box` / `Cone` / `PlanePrimitive` 在 IECoreScene 1.6.5.1 里不存在。

## 注意事项

- Gaffer 基本体节点（Sphere / Cube / Plane / Text）输出的是 `MeshPrimitive`；`SpherePrimitive` 这类只在 USD / Alembic 读入时出现。Grid 输出 `NullObject`。
- `GafferScene::Capsule` 指封装场景片段的那种对象类型，映射按对象类型匹配。
- `IECoreScene.Shader` 的名字是 `.name` 属性，没有 `getName()`；构造 `ShaderNetwork` 要 `setOutput`。
- 菜单相关的三个实测事实：
  - checkable 菜单项的命令会多收一个勾选状态参数（`Menu.__actionTriggered` 把它 append 进 args），命令签名要留 `*unused`。
  - 子菜单懒构建：`MenuDefinition` 路径只建空壳 `_Menu`，`aboutToShow` 时才填内容；测试里先 `menu._buildFully()` 再找 action。
  - `Menu.popup( position )` 的 position 是全局屏幕坐标；多显示器时整窗截图抓不到副屏，抓控件本身。
- 验证：无头 47 条断言（灯光映射、属性、真实场景类型、16x16、列 patch 幂等），screengrab 断言 mesh / camera / group 图标；截图 `Music/_scratch/hmc_tests/shots/hmc_autoicons.png`。方法论技能 `~/.claude/skills/gaffer-hierarchy-column/`。

## 相关

- 实体：[[Gaffer]] —— 所属软件
- 实体：[[Arnold]] —— 灯光 shader 类型来源
- 概念：[[Gaffer PathColumn]] —— 自定义列的基类
- 综述：[[替换 Gaffer 原生编辑器的方法]] —— patch 原生列的做法
- 来源：[[来源 - Claude 全局记忆]]

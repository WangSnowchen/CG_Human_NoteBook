---
type: synthesis
aliases: [gaffer-node-docs, 节点文档出图流程]
tags: [gaffer, documentation, screengrab]
applies_to: ["Gaffer 1.6.5.1"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# NodeReference 节点案例制作流程

[[gaffer_zh_docs]] 里新模板节点页的制作方法：把 Gaffer 源码测试改写成艺术家看得懂的案例，配 Viewer 前后对比图。Instancer 和第一梯队 10 个节点都按这套做完。也沉淀成了 Claude Code 技能 `~/.claude/skills/gaffer-node-docs/`，出图脚本在 `gaffer_zh_docs/_work/`。

## 模板规格

- **前后对比**：两张并排，中间一条分割线，「前 / 后」标签画进图里，不靠正文说明。
- **静态差异用并排图，演示「变化过程」用 GIF**。GIF 里相机固定不动，只让参数变化，避免镜头运动分散注意力。
- **尺寸**：Viewer 单张 800×600，并排约 1600×634，GIF 宽 640。
- **全站统一机位**：`imath.V3f( -1, -0.55, -1 ).normalized()`。

## 步骤

1. **翻译**：读官方文档 `_repos/GafferHQ/documentation/1.7.0.0/_sources/Reference/NodeReference/GafferScene/<Node>.md.txt`。插口名保留英文，描述译成中文，setext 标题结构原样保留。
2. **挑案例**：读 `_repos/GafferHQ/gaffer/python/GafferSceneTest/<Node>Test.py`，`def test*` 方法名就是行为清单。挑 2-3 个艺术家能理解的行为，跳过性能、哈希、序列化类测试。枚举值、默认值、用法都在测试文件里，不用翻 C++ 头文件。
3. **改写代码**：测试里手工构造的 `CompoundObjectSource` 换成原生图元节点（Plane / Sphere / Cube），加中文注释，末尾一次 `root.addChild(...)` 加入。
4. **无头验证**：`bin/gaffer env python` 跑断言，例如 `fullTransform().multDirMatrix()` 验朝向、`childNames` 验层级；`InternedString` 要先 `str()` 再比较。
5. **截图**：每个案例 3 个视图（GraphEditor / HierarchyView / NodeEditor），用一个出图脚本按环境变量 `GROUP_CASE` + `EDITOR` 分流，经 [[Gaffer screengrab]] 抓图：
   - **GraphEditor**：自动 frame 有缩放上限，节点会很小，要手动算节点组包围盒再 frame，见 [[Gaffer 节点图截图节点太小看不清]]。
   - **HierarchyView**：`script.setFocus( node )`，命令行加 `-editor GafferSceneUI.HierarchyView -scene.expandedPaths "/a/b" ...`。展开状态只能走 `-scene.expandedPaths` 参数，在 commandFile 里展开会被 screengrab 随后清空。
   - **NodeEditor**：`GafferUI.NodeEditor.acquire( node, floating = True )` + `_qtWidget().setFocus()` + `application.setGrabWidget(...)`。
   - 环境变量分流的脚本忘传 `EDITOR` 之类的变量会走错分支、抓出空白图。
6. **拼装 md**：`<Node>.md` = 翻译 + 每个案例「描述 + 3 张视图 + `{dropdown}` 折叠代码」。MyST 嵌套代码块外层用 4 个反引号、内层 3 个。再接进 `GafferScene/index.md` 的 toctree。
7. **构建检查**：0 警告，图片全部被引用，dropdown 数量正确。

## 相关

- 实体：[[gaffer_zh_docs]] —— 应用这套流程的文档项目
- 实体：[[Gaffer screengrab]] —— 截图工具
- 问题：[[Gaffer 节点图截图节点太小看不清]] —— GraphEditor 截图的放大办法
- 综述：[[Gaffer 无头测试与截图验证方法]] —— 无头断言与截图的通用方法
- 来源：[[来源 - Claude 全局记忆]]

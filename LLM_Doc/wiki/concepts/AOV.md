---
type: concept
aliases: [Arbitrary Output Variable, 渲染分层通道]
tags: [arnold, rendering, aov, compositing]
applies_to: []
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# AOV

## 定义

Arbitrary Output Variable：渲染时在主图像之外额外输出的通道，例如只含漫反射、只含高光、法线、深度、物体 ID 的图层，供合成阶段分别调整。Arnold 用光路表达式（Light Path Expression，如 `C<RD>A`）定义一个 AOV 收集哪类光线贡献。

## 在各软件里的对应

- **Arnold**：Outputs 里的每个 AOV 有名字、数据类型（`rgba` 等）、光路表达式和滤波器。P / N / Pref / Z 这类数据通道用 `closest` 滤波避免混色。
- **Gaffer 原生**：`Outputs` 节点定义输出，参数里可加 `filter=gaussian` 设滤波。
- **团队节点**：[[ArnoldAovManager]] 用 JSON 白名单建 AOV，`ArnoldAovDeleter` 按列表删或反向保留。
- **自定义 AOV**：在材质里用 `aov_write_rgb` shader 链（passthrough 串接）把贴图写进命名 AOV，常用来输出 ID 图。
- **cryptomatte**：`aov_id1..8` 配合 crypto（asset / object / material）输出。

## 注意事项

- 常用 AOV 的表达式全集见 [[Arnold AOV 表达式速查]]。
- 降噪时要排除数据类 AOV，见 [[降噪]]。
- deep 也是以 AOV 的方式加进去的，见 [[Deep 输出]]。

## 相关

- 实体：[[Arnold]] —— 定义 AOV 的渲染器
- 实体：[[ArnoldAovManager]] —— 团队管理 AOV 的节点
- 综述：[[Arnold AOV 表达式速查]] —— 常用 AOV 的光路表达式
- 综述：[[Gaffer 渲染设置模板]] —— AOV 在渲染设置里的位置
- 概念：[[Deep 输出]] —— 以 AOV 形式添加
- 概念：[[降噪]] —— 降噪要挑选 AOV 层
- 来源：[[来源 - Claude 全局记忆]]

---
type: concept
aliases: [Deep Output, Deep EXR, deep 图像]
tags: [arnold, rendering, compositing, aov]
applies_to: []
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# Deep 输出

## 定义

每个像素保存多个带深度的采样（普通图像每个像素只有一个颜色值）。合成时可以按深度正确地叠加不同渲染层、体积和元素，不需要单独的 holdout 层。

## 在各软件里的对应

团队配方里 Gaffer + Arnold 的做法：

1. `StandardOptions` 打开 `transformBlur`、`deformationBlur`、`shutter`、`sampleMotion`。缺少这些运动模糊选项时 deep 数据不完整。
2. `ArnoldOptions`。
3. 用 [[ArnoldAovManager]]（配方里写作 CreateArnoldAOVs）加一条 deep AOV：

   ```json
   {"<deep>": {"deep": {"name": "deep", "data_type": "rgba", "expression": "C.*"}}}
   ```

## 注意事项

- 只渲 deep 时把 GI 采样设为 0 可以加速。
- 阴影 matte 拆成 `shadow` / `shadow_mask` / `shadow_diff` 三个通道。

## 相关

- 概念：[[AOV]] —— deep 以 AOV 方式添加
- 概念：[[运动模糊]] —— deep 依赖运动模糊选项
- 实体：[[ArnoldAovManager]] —— 加 deep AOV 的节点
- 实体：[[Arnold]] —— 渲染器
- 综述：[[Gaffer 渲染设置模板]] —— 渲染输出配方
- 综述：[[Arnold AOV 表达式速查]] —— deep 与其它 AOV 的表达式汇总
- 来源：[[来源 - Claude 全局记忆]]

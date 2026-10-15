---
type: concept
aliases: [过扫描, Crop Window, 裁剪窗口]
tags: [gaffer, rendering, camera]
applies_to: []
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# Overscan

## 定义

在画面四周多渲染一圈像素，给合成阶段的镜头抖动、重新构图、畸变留余量。相关的 crop window（裁剪窗口）只渲染画面的一部分，常用于局部补渲或分块渲染。

## 在各软件里的对应

Gaffer 团队配方：

- **BrutalOverScan**：Expression 算 `焦距系数 = 源分辨率.x / 目标分辨率.x`，接到 `CameraTweaks.focalLength`（mode=3，乘法），再在 `StandardOptions` 里打开 `overscan=True`。
- **auto_setup_crop_window**（按物体自动设裁剪窗口）：
  1. `BoundQuery`（space=2，NDC）+ `OptionQuery` 拿物体包围盒和相机。
  2. 按钮回调里用 `camera.frustum()` 算 screen 尺寸。
  3. Python Expression 把包围盒的角点投影到 NDC，算出 crop + border，翻转 Y 并 clamp。
  4. 结果写进 `StandardOptions.renderCropWindow`。
- **RegionRenderManager**（分块渲染）：`context.get("regionRender:index", frame) % (N*N)` 算当前块号，Expression 输出这一块的 crop min / max，逐块渲染。

## 注意事项

- crop 计算在 NDC 空间里做，Y 方向要翻转。

## 相关

- 实体：[[Gaffer]] —— `StandardOptions` 的 overscan / renderCropWindow
- 综述：[[Gaffer 渲染设置模板]] —— 渲染输出配方
- 综述：[[Gaffer 查询回写闭环]] —— 自动 crop 用的是查询 → 表达式 → 回写
- 来源：[[来源 - Claude 全局记忆]]

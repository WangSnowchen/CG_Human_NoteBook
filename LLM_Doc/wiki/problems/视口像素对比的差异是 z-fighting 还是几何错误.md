---
type: problem
aliases: [z-fighting, Z-fighting 判读, 视口 A/B 像素对比]
tags: [gaffer, viewport, opengl, testing]
applies_to: ["Gaffer 1.7.1.0"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# 视口像素对比的差异是 z-fighting 还是几何错误

## 现象

改了视口绘制代码后，和原生逐像素对比出现零散的差异像素，不确定是不是改坏了（[[来源 - Claude 全局记忆]]）。

## 原因

场景里有共面重叠的面（z-fighting）。哪个面在最前取决于提交顺序和深度精度，换一种绘制方式就可能换赢家；原生自己连跑两次也不完全一样。

## 解决

先分类再下结论：

1. 先拿原生跑两次互相比，得到这个场景本身的噪声底。长仙村 render 全景是 z-fighting 场景，原生两次就差 0.11%。
2. **z-fighting**：差异像素亮暗各半、散在全图，按格子算平均色和原生一致。
3. **几何错误**：成片、同一个方向、差值 > 64 的一大块。
4. 需要保持原生赢家时，延后绘制用 `GL_LEQUAL` 并在组内按对象顺序倒排，让共面网格「先画的赢」（见 [[Multi Draw Indirect 批量绘制]]）。

其他已知的噪声：

- GPU 同时被别的进程占用时，像素对比会整图偏。
- uv 调试模式右上角有一块每次差得不一样，原生自己比是 0 差，最像共面 z-fighting，还没验证。

## 验证方法

- 两个进程分别跑原生和新实现，离屏逐像素比（[[gaffer_indexed_mesh]] 的 `proces_scode/run_compare.sh`）。
- [[Gaffer screengrab]] 的窗口尺寸会随屏幕状态变化，比之前先 `resize` 到固定尺寸。
- 两条对照的环境变量写在各自命令里，别在外层 shell `export`；测 rez 包那份时带 `GAFFER_EXTENSIONS_DISABLE=local:indexedmesh`。
- 通用的无头与截图验证方法见 [[Gaffer 无头测试与截图验证方法]]。

## 相关

- 实体：[[gaffer_indexed_mesh]] —— 对比脚本所在的包
- 实体：[[Gaffer screengrab]] —— 截图工具
- 概念：[[Multi Draw Indirect 批量绘制]] —— 延后绘制会改变共面面的赢家
- 问题：[[IECoreGL 着色器预处理器不认 version 430]] —— 派生着色器编译后用这套方法验画面
- 综述：[[Gaffer 无头测试与截图验证方法]] —— 更通用的验证流程
- 来源：[[来源 - Claude 全局记忆]]

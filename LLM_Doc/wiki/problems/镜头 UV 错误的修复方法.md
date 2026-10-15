---
type: problem
aliases: [UV 修复, Gaffer UV fix]
tags: [gaffer, uv, shot-fix]
applies_to: []
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# 镜头 UV 错误的修复方法

## 现象

镜头里读入的几何 UV 坏了：贴图错位、镜像、翻面，或某几帧 UV 跳变；也有 UV 本身不连续导致贴图接缝明显的情况。

## 原因

常见来源：上游缓存导出时 UV 丢失或被改动、拓扑相同但 UV 版本不一致、个别帧的缓存 UV 损坏。

## 解决

[[lgtLib 共享节点库]] 里的修复配方：

1. **删掉再从参考几何拷**：

   ```text
   DeletePrimitiveVariables('uv')
     → CopyPrimitiveVariables(source = 参考 SceneReader, sourceLocation = 同拓扑网格)
   ```

   - 目标几何在很深的层级时，先用 `Isolate` / `SubTree` 取出来。
   - source 端用 `Group` + `Rename` 把命名改成和目标一致，路径对得上才拷得过去。
2. **镜像 / 平移 UV**：OSL 网络 `InUV → MultiplyVector((-1,1,1)) → AddVector(偏移)`，需要时加 `ReverseWinding` 翻面。
3. **UV 不连续导致接缝**：绕开 UV，用三平面投影 `aiTriplanar(coord_space='Pref')` + `layer_rgba`。
4. **只有个别帧 UV 坏**：从好的一帧采样 UV 再拷过去：`TimeWarp(speed=0, offset=1001)` → `CopyPrimitiveVariables`。

## 验证方法

在 Viewer 里用 UV 显示模式检查，或渲一张棋盘格贴图，问题帧和前后帧逐一对比。

## 相关

- 实体：[[lgtLib 共享节点库]] —— 配方来源
- 实体：[[OSL]] —— 镜像、平移 UV 用的 OSL 网络
- 综述：[[Gaffer 按帧门控]] —— TimeWarp 固定到某一帧采样
- 综述：[[资产与特效 Resolver 模板]] —— 读入环节的命名整理
- 来源：[[来源 - Claude 全局记忆]]

---
type: problem
aliases: [Group 根名碰撞]
tags: [gaffer, scene, testing]
applies_to: ["Gaffer 1.6.5.1"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# Gaffer Group 同名输入合并后为空

## 现象

两个场景处理器（例如各自接了一个 Plane 的处理器）的输出都接进同一个 Group，`group["out"].childNames( "/group" )` 返回空，层级里什么都没有。直接把两个裸 Plane 接进 Group 却正常，得到 `plane` 和 `plane1`。

## 原因

两路输入的根下子位置同名（都叫 `plane`）。裸图元节点输入时 Group 会去重改名；经过场景处理器后的同名根子在这里发生碰撞，结果为空。Plane 输出的根子名是几何名 `plane`，不是节点名，所以两个不同名的 Plane 节点仍会撞名。

## 解决

搭测试场景时让各路输入的根子名不同：用不同的图元（Sphere / Cube / Plane），或在图元节点上改 `name` 插口。

## 验证方法

接好后检查 `group["out"].childNames( "/group" )` 包含所有预期子位置。

## 相关

- 实体：[[Gaffer]] —— 所属软件
- 问题：[[Gaffer Group 手动加输入插口产生多余插口]] —— 搭 Group 测试场景的另一个坑
- 综述：[[Gaffer 无头测试与截图验证方法]] —— 测试场景的搭法
- 来源：[[来源 - Claude 全局记忆]]

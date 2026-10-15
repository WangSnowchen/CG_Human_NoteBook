---
type: problem
aliases: [ColorChooserDialogue OK, 拾色器 OK 不写插口]
tags: [gaffer, gafferui, color]
applies_to: ["Gaffer 1.6.5.1"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# Gaffer 拾色器弹窗点 OK 不生效

## 现象

替换了原生拾色器（[[ueColorChooser]]）后，在弹窗里选好颜色点 OK，弹窗关掉了，颜色插口的值没变（[[来源 - Claude 全局记忆]]）。

## 原因

- 原生 `_ColorPlugValueDialogue` 靠监听拾色器的 `colorChangedSignal` 往插口里写值，OK 按钮本身只负责关窗。
- 自制拾色器把预览和提交分开：拖动时只改预览值，按 OK 时调 `commitPreview()` 才把预览变成正式值。`commitPreview()` 没有发 `colorChangedSignal`，对话框就永远收不到变化。

## 解决

OK 时 `commitPreview()` 必须**发信号**，顺序固定：

1. 提交预览值并发 `colorChangedSignal`（插口在这里被写入）。
2. 记录进最近颜色。
3. 调子类回调。

## 验证方法

在 screengrab 或无头 GafferUI 测试里打开颜色插口的弹窗，程序设置一个预览颜色再触发 OK，断言插口值等于该颜色，并能一步撤销。

## 相关

- 实体：[[ueColorChooser]] —— 出问题的拾色器
- 综述：[[替换 Gaffer 原生编辑器的方法]] —— 替换类必须守住原生接口契约
- 来源：[[来源 - Claude 全局记忆]]

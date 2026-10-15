---
type: problem
aliases: [GafferUI 容器父子关系, ListContainer append]
tags: [gaffer, gafferui, qt]
applies_to: ["Gaffer 1.6.5.1"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# GafferUI 已创建的控件放进容器后不显示

## 现象

先创建好一个控件，再在 `with GafferUI.ListContainer(...) :` 块里写上它的变量名，想把它放进容器。运行后控件完全不可见；检查发现它的父对象是 None、尺寸停在 640x480、从没参与布局。

## 原因

GafferUI 容器的父子关系只在「控件**创建时**处于容器的 with 上下文里」才自动建立（构造函数检查当前上下文栈）。在 with 块里写一个已经存在的控件名只是一个表达式，什么都不做。

## 解决

已创建的控件显式加进容器：

```python
with GafferUI.ListContainer( GafferUI.ListContainer.Orientation.Vertical ) as column :
    GafferUI.Label( "标题" )        # 在上下文里创建，自动加入
column.append( existingWidget )      # 事先创建的控件要显式 append
```

`ListContainer.append` 内部会先从旧父对象移除（`oldParent.removeChild`），所以在别处建好再 append 是安全的。拆分成多个 builder 函数时，builder 必须在 `with self.__column :` 里被调用，否则里面创建的控件不会挂到正确容器。

## 验证方法

检查 `widget.parent()` 不为 None；`window._qtWidget().show()` + `waitForIdle` 后 `widget._qtWidget().isVisibleTo( window._qtWidget() )` 为 True。截图不能用来判断（离屏抓图会画出未布局的内容），见 [[Gaffer Overlay]]。

## 相关

- 实体：[[Gaffer]] —— 所属软件
- 概念：[[Gaffer Overlay]] —— 拼装 overlay 内容时最常踩到
- 概念：[[GafferUI LazyMethod]] —— 另一类「控件没显示」的原因
- 来源：[[来源 - Claude 全局记忆]]

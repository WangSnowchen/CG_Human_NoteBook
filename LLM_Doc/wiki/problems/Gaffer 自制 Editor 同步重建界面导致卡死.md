---
type: problem
aliases: [Editor 重建死循环, __uiPosition childAdded 循环]
tags: [gaffer, gafferui, editor, performance]
applies_to: ["Gaffer 1.6.5.1", "Gaffer 1.7.1.0"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# Gaffer 自制 Editor 同步重建界面导致卡死

## 现象

自己写的 layout Editor 在 `childAdded` / `childRemoved` / `Metadata.nodeValueChangedSignal( node )` 回调里同步重建整个界面。只开一个实例时正常；layout 里开两个实例后 Gaffer 卡死，CPU 100%，内存涨到约 1.8 GB。

## 原因

GraphEditor 在渲染前（`__preRender` → `positionNodes`）会给新节点写 `__uiPosition` 子插口，这会触发 `childAdded`。编辑器同步重建 → 调 setPath 之类触发新一次渲染 → 再写 `__uiPosition` → 再重建，事件循环永远等不到空闲。两个实例互相触发，形成死循环。

## 解决

信号回调里只标记「需要更新」，用一次性、去重的空闲回调做真正的重建：

```python
def __graphChanged( self, *unused ) :
    if self.__updatePending :
        return
    self.__updatePending = True
    GafferUI.EventLoop.addIdleCallback( self.__idleUpdate )

def __idleUpdate( self ) :
    self.__updatePending = False
    self.__update()
    return False    # 只执行一次
```

`__init__` 里仍可同步调用一次 `__update()`。继承 `NodeSetEditor` 的编辑器直接用基类的 LazyMethod（`self._NodeSetEditor__lazyUpdate()`），见 [[GafferUI LazyMethod]]。

其他刷新细节：

- 节点改名只触发 `node.nameChangedSignal()`，`childAdded` / `childRemoved` / 元数据信号都不响；要即时刷新改名就逐节点连 `nameChangedSignal`。
- 改名后缓存按插口身份（`isSame()`）迁移，不按名字重建。
- 拖动、编辑控件进行中不要重建（会让 Qt 的鼠标抓取或输入焦点丢失），等操作结束再刷新。

## 验证方法

- layout 里开两个实例，建节点、改名、改元数据，CPU 保持空闲。
- 无头单测在断言前先 `waitForIdle()`（重建推迟到空闲之后了）。
- 卡死时诊断：`faulthandler.dump_traceback_later( 12, repeat=True, file=sys.stderr )` 定时打印栈（gdb 受 ptrace 限制用不了）。

## 相关

- 实体：[[Gaffer]] —— 所属软件
- 实体：[[gaffer_network_editor]] —— 重建一律推迟到空闲时
- 实体：[[SpreadsheetOverviewEditor]] —— 同类自制编辑器
- 概念：[[GafferUI LazyMethod]] —— 基类自带的延迟去重更新
- 综述：[[替换 Gaffer 原生编辑器的方法]] —— 自制编辑器的通用做法
- 综述：[[在 Gaffer 里另做 Qt 节点图编辑器]] —— 节点图编辑器的重建放进 idle 回调
- 综述：[[Gaffer 无头测试与截图验证方法]] —— 卡死诊断与断言前等空闲
- 来源：[[来源 - Claude 全局记忆]]

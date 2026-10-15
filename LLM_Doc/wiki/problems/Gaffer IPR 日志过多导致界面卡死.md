---
type: problem
aliases: [IPR 日志卡死, MessageWidget 卡死]
tags: [gaffer, gafferui, ipr, logging, performance]
applies_to: ["Gaffer 1.6.5.1"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# Gaffer IPR 日志过多导致界面卡死

## 现象

IPR 渲染时日志刷得很快，Gaffer 界面卡住不响应；日志面板（[[Gaffer LogView]]）保留历史后，超过上限的消息越多越卡，2.4 万条洪泛要处理约 40 秒（[[来源 - Claude 全局记忆]]）。

## 原因

1. 默认 `_MessageHandler.handle()` **每条消息调用一次 `executeOnUIThread`**，渲染线程产生消息的速度远超 UI 线程处理速度，事件队列无界增长。
2. `Gaffer.Private.IECorePreview.Messages` 不支持切片、`del`、从 list 构造，删旧消息只能整段取尾部重建，是 O(n) 操作。裁剪守卫如果拿「重建目标」`keep = maxHistory // 2` 来比，每来一条超限消息都会触发一次重建。

## 解决

1. 渲染线程只做廉价的 append 进缓冲，合并后由 UI 线程一次 `setMessages()` 批量 diff 更新。
2. 裁剪守卫比上限，超了才一次裁到一半：

   ```python
   if len( master ) <= self.__maxHistory :
   	return
   keep = self.__maxHistory // 2
   # 取最后 keep 条重建
   ```

修好后 2.4 万条洪泛约 1.06 秒。

## 验证方法

无头脚本里从工作线程连发 2 万条以上消息，计时到 UI 线程处理完（`waitForIdle()`），同时检查历史条数不超过上限。

## 相关

- 实体：[[Gaffer LogView]] —— 出问题的日志面板
- 来源：[[来源 - Claude 全局记忆]]

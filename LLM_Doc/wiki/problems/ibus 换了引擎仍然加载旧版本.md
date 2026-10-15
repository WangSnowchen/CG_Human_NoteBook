---
type: problem
aliases: [ibus component cache, ibus registry]
tags: [input-method, linux]
applies_to: ["ibus 1.5.22"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---
# ibus 换了引擎仍然加载旧版本

## 现象

自编了新的 [[ibus-rime]]，组件 xml 放进用户级组件目录、设好 `IBUS_COMPONENT_PATH` 并重启 ibus，实际运行的仍是系统的 `/usr/lib/ibus-rime/ibus-engine-rime`。

## 原因

ibus 把组件清单缓存在 `~/.cache/ibus/bus/registry`。新加的组件目录不在缓存记录里，普通重启照样按缓存启动旧引擎（[[来源 - Claude 全局记忆]]）。

## 解决

重启 ibus 时带 `--cache=refresh` 强制重建缓存：

```bash
IBUS_COMPONENT_PATH=$HOME/.local/share/ibus/component \
  ibus-daemon -drx -R --cache=refresh --panel=$HOME/.local/bin/ibus-ssf-skin-panel
```

## 验证方法

查引擎进程实际加载的 librime：

```bash
grep librime /proc/$(pgrep -f current/libexec/ibus-rime)/maps
```

输出路径在 `~/Music/third_party/ibus/rime/` 下即为自编版本。

## 相关

- 实体：[[ibus-rime]] —— 自编的输入法引擎
- 来源：[[来源 - Claude 全局记忆]]

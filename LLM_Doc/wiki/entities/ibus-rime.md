---
type: entity
aliases: [Rime, librime, 雾凇拼音, rime_ice, 中州韵]
tags: [input-method, linux, build]
applies_to: ["librime 1.17.0", "ibus-rime 1.6.1"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---
# ibus-rime

Rime 输入法引擎（librime）在 ibus 下的前端。本机日常输入法是雾凇拼音（rime_ice）方案跑在自编的 ibus-rime 上：librime 1.17.0 + Lua / octagram / predict 插件，全部在 `~/Music/third_party/ibus/rime/`（README 写了布局、接入方式、坑位、训练流程，`build.sh` 一键重编）（[[来源 - Claude 全局记忆]]）。

## 要点

- **为什么自编**：Ubuntu 20.04 自带的 librime 1.5.3 没有 Lua 插件，雾凇方案的 15 个 `lua_*` 组件全部静默失效（部署日志里只有一行 `error creating translator: 'lua_translator'`）。
- **没有 sudo 的安装方式**：装到 `rime/1.17.0/`（`current` 软链指向它）；ibus 用用户级组件目录 `~/.local/share/ibus/component/`（系统组件 xml 软链过来 + 自己的 `rime.xml`），通过 `IBUS_COMPONENT_PATH` 让 ibus 看到它，这个变量写在 `~/.config/plasma-workspace/env/ibus-rime-local.sh`。
- **粘滞中英补丁**：原补丁（针对 ibus-rime 1.4.0）打不上 1.6.1，七处接线手工移植，成品 `rime/ibus-rime-1.6.1-sticky-and-compat.patch`；系统里 1.4.0 补丁版留着当回退。
- **语言模型**：方案语法用 `zh-hans-t-essay-bgw`，搭配长度用官方默认（改成 5/2 会把「乐趣」组成「了去」）。
- **上屏记录**：`lua/commit_logger.lua` 把含汉字的上屏追加到 `commit_log/YYYY-MM.txt`（`时间戳\t文字`），攒够语料后用 `tools/train_from_commit_log.py` 重建个人语言模型 `personal-zh-hans.gram`。
- **上下文联想（librime-predict）编进了库但没挂进方案**：它的联想是在上屏后进入一个带 `prediction` 标签的组词状态，每次打完字都多一个候选框、左右键被接管，只有 BackSpace / Escape 能退出，没有「只显示不接管」的模式。README 写了重新启用的写法，`tools/make_predict_from_dict.py` 能重新生成 `predict.db`。
- 用户词典学习（`rime_ice.userdb`）一直开着。

## 用法 / 关键参数

重启 ibus（**必须带 `--cache=refresh`**，见 [[ibus 换了引擎仍然加载旧版本]]）：

```bash
IBUS_COMPONENT_PATH=$HOME/.local/share/ibus/component \
  ibus-daemon -drx -R --cache=refresh --panel=$HOME/.local/bin/ibus-ssf-skin-panel
```

确认跑的是自编库：

```bash
grep librime /proc/$(pgrep -f current/libexec/ibus-rime)/maps
```

用户目录 `~/.config/ibus/rime` 里的定制：

| 文件 | 作用 |
|---|---|
| `rime_ice.custom.yaml` | 设 `grammar`（`zh-hans-t-essay-bgw`）、挂 `lua_processor@*commit_logger`、换个人词库 |
| `lua/commit_logger.lua` | 上屏记录 |
| `zh-hans-t-essay-bgw.gram` | 官方语言模型 |
| `cn_dicts/mine.dict.yaml` | 个人词条，如 `飞书	fei shu	100000` |
| `rime_ice_mine.dict.yaml` | mine 排第一，再 import 雾凇原词库 |

**个人词条**：`translator/dictionary: rime_ice_mine` 必须同时配 `translator/user_dict: rime_ice`，否则会另起一个空的 userdb，学到的习惯全丢。权重能治同音字顶替（整句里「飞书」被 octagram 换成「飞鼠」），治不了切分错误（`jiafeishu` → 加菲恕，权重加到 200 万也不变）。

**训练数据格式**：

- `build_predict` 读 `key\ttext\tweight`；
- `build_grammar <name>` 读 `字串\t频次`（存 `log(频次)`，频次 ≥ 1），句尾字串加 `$`；查询时拿上下文末尾 1～3 字 + 候选词头做 trie 前缀匹配。
- octagram 一次只挂一个模型，官方 `.gram` 是二进制 trie，合并不进去；语料只有几万字时别替换官方模型。

## 编译要点

全部固化在 `build.sh` 里：

- 本机没有 boost → 下载 1.92 只编 regex，静态 + `-fPIC`。
- `make deps` 编出的 leveldb 没有 PIC，要补。
- 内置 Lua 开了 `LUA_USE_DLOPEN`，cmake 要加 `-DCMAKE_CXX_STANDARD_LIBRARIES=-ldl`。
- 系统 ibus 1.5.22 缺 `ibus_attr_hint_new` / `IBUS_ATTR_PREEDIT_*`（1.5.28 才有），用 `ibus_compat.h` 兼容。
- ibus 开发包用解压的 deb 放在 `.sysroot`，改 `.pc` 文件里的 prefix（不用 `PKG_CONFIG_SYSROOT_DIR`），且 sysroot 里不能留 librime-dev 的头文件。

## 验证方法

- `rime_api_console`：在用户目录下运行，stdin 一行一串按键，打印上屏和候选。改词库之类的测试在副本目录里跑，真目录跑会写上屏记录、改 userdb。
- 真键入：`zenity --entry` 弹输入框，`xdotool` 打字。先 `ibus engine rime`（按程序切换引擎的插件对没见过的程序默认英文）；别按 Escape（zenity 当成取消、输出为空）；结束用 `pkill -x zenity`（`pkill -f 'zenity …'` 会匹配到当前 shell 自己）。真键入测试后把测试那几行从上屏记录里删掉。

## 常见问题

- [[ibus 换了引擎仍然加载旧版本]]

## 相关

- 问题：[[ibus 换了引擎仍然加载旧版本]] —— 组件清单缓存
- 实体：[[Music 测试实验室]] —— 安装在 third_party/ibus/rime
- 来源：[[来源 - Claude 全局记忆]]

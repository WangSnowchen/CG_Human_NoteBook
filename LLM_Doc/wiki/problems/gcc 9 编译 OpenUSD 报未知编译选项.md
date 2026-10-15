---
type: problem
aliases: [unrecognized command line option -Wmismatched-tags]
tags: [usd, build, gcc, cmake]
applies_to: ["OpenUSD 26.11"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---
# gcc 9 编译 OpenUSD 报未知编译选项

## 现象

用本机 gcc 9.4 编 [[OpenUSD]]，编译中断：

```text
g++: error: unrecognized command line option '-Wmismatched-tags'
```

## 原因

`cmake/defaults/gccclangshareddefaults.cmake:18` 无条件加了 `-Wmismatched-tags`，这个警告开关 GCC 10 才有，gcc 9 直接报错退出。没有任何 cmake 选项能关掉它（[[来源 - Claude 全局记忆]]）。

## 解决

不改源码（源码检出是只读引用，以后 git pull 不冲突），用编译器包装脚本把这个参数滤掉再交给真正的编译器。`Music/third_party/usd/toolchain/g++`：

```bash
#!/bin/bash
DROP=( -Wmismatched-tags )
args=()
for a in "$@"; do
    skip=0
    for d in "${DROP[@]}"; do [[ "$a" == "$d" ]] && skip=1; done
    (( skip )) || args+=( "$a" )
done
exec /usr/bin/g++ "${args[@]}"
```

`gcc` 同理。编译时传给 cmake：

```bash
export CC=~/Music/third_party/usd/toolchain/gcc CXX=~/Music/third_party/usd/toolchain/g++
```

以后再碰到 gcc 9 不认识的选项，往 `DROP` 数组里加一项。改了 `CC` / `CXX` 之后要删掉 `_build/OpenUSD`，否则 cmake 报 compiler changed。

## 验证方法

重新跑 `build_usd.py`，`_build/OpenUSD` 下的 `.o` 文件数持续增长，构建完成后 `usdcat --help` 能运行。

## 相关

- 实体：[[OpenUSD]] —— 被编译的项目，完整编译命令在实体页
- 来源：[[来源 - Claude 全局记忆]]

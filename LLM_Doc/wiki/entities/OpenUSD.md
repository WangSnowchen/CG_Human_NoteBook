---
type: entity
aliases: [USD, Universal Scene Description, pxr]
tags: [usd, pipeline, file-format]
applies_to: ["OpenUSD 26.11"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---
# OpenUSD

Pixar 开源的场景描述格式和库（Python 包名 `pxr`）。团队的资产、镜头缓存都用 USD；[[Gaffer]] 读写 USD，[[Houdini]] 的 Solaris 整个建在 USD 上。本机另外自编了一套 26.11 的命令行工具（[[来源 - Claude 全局记忆]]）。

## 要点

- **每个 DCC 自带一份 USD**，版本和 C++ 命名空间各不相同（Houdini 21.0 是 `pxrInternal_v0_25_5`）。外部编译的 `pxr` 一旦进了某个 DCC 的 Python 路径，就会和它自带的那份打架，见 [[外部 USD 进入 PYTHONPATH 导致 Houdini 崩溃]]。
- **本机自编的命令行工具**：版本 26.11，源码 `Music/_repos/PixarAnimationStudios/OpenUSD`，装在 `Music/third_party/usd/`。终端里可直接用 `usdcat` / `usdedit` / `usdtree` / `usdchecker` / `usddiff` / `usdzip` / `usdstitch` / `usdresolve` / `usdGenSchema` 等 17 个工具。
- **这一份是核心版**：编译时关掉了 imaging、usdview、MaterialX、示例、教程、测试，第三方依赖只有 TBB 2020.3。`pxr` 里没有 `CameraUtil` / `GeomUtil` / `Ndr` / `PxOsd` / `UsdMtlx`。
- **没有 usdview**：要图形化浏览用 Gaffer 1.7.1.0 自带的 `/mnt/centralizedRepo/third_party/gaffer/linux/1.7.1.0/bin/usdview`。

## 用法 / 关键参数

目录布局：

| 路径 | 内容 |
|---|---|
| `usd/26.11/` | 安装区 |
| `usd/current -> 26.11` | 升级只改这个软链 |
| `usd/bin/` | 每个工具一个包装脚本，只给自己那个进程设 PYTHONPATH；另有 `usd-python`（带 `pxr` 的 python3，跑一次性脚本用） |
| `usd/_build/`、`usd/_src/` | 中间产物，可删，留着增量重编快 |
| `usd/toolchain/` | 编译器包装脚本，见 [[gcc 9 编译 OpenUSD 报未知编译选项]] |

`~/.zshrc` 只做两件事：`export USD_ROOT=...`，把 `~/Music/third_party/usd/bin` 加进 PATH。**不设全局 PYTHONPATH**。17 个工具里有几个是 ELF 可执行文件，本来就不需要 PYTHONPATH；其余是 Python 脚本，由包装脚本各自设置。包装脚本由 `usd/_build/make_wrappers.sh` 生成，走 `current` 软链，升级版本后重跑一次。

```bash
usdcat shot.usdc | less
usdtree -a shot.usd
EDITOR=/bin/true usdedit -n file.usdc      # 无头验证 usdedit 链路
usd-python -c "from pxr import Usd; print(Usd.GetVersion())"
```

`usdedit` 找编辑器的顺序：`USD_EDITOR` > `EDITOR` > emacs > vim > notepad。

重新编译（改了源码或要加 imaging）：

```bash
cd ~/Music/_repos/PixarAnimationStudios/OpenUSD
export CC=~/Music/third_party/usd/toolchain/gcc CXX=~/Music/third_party/usd/toolchain/g++
python3 build_scripts/build_usd.py --no-imaging --no-examples --no-tutorials --no-materialx \
  --build ~/Music/third_party/usd/_build --src ~/Music/third_party/usd/_src -j 24 \
  ~/Music/third_party/usd/26.11
```

- cmake 必须低于 4：本机没有系统 cmake 也没有 sudo，用 `pip install "cmake>=3.27,<4"`。CMake 4 去掉了对 `cmake_minimum_required(VERSION <3.5)` 的兼容，oneTBB 这类依赖会拒绝构建。
- 改了 `CC` / `CXX` 后要删掉 `_build/OpenUSD`，CMakeCache 记着旧编译器。
- `build_usd.py` 的输出是块缓冲的，重定向到日志时前几分钟日志是空的；看进度数 `_build/OpenUSD` 下 `.o` 文件的个数。
- 想要 usdview 就去掉 `--no-imaging`，另需 `pip install PySide6 PyOpenGL`；gcc 9.4 编 OpenSubdiv / MaterialX 没验证过。

## 常见问题

- [[外部 USD 进入 PYTHONPATH 导致 Houdini 崩溃]]
- [[gcc 9 编译 OpenUSD 报未知编译选项]]

## 相关

- 实体：[[Gaffer]] —— 读写 USD，并自带 usdview
- 实体：[[Houdini]] —— Solaris 基于 USD，自带一份 pxr
- 实体：[[Music 测试实验室]] —— 源码检出和 third_party 安装区所在
- 概念：[[视锥剔除]] —— USD 场景（含 `PointInstancer` 点云）读进 Gaffer 后在视口阶段剔除
- 综述：[[资产与特效 Resolver 模板]] —— 团队用 USD 交付资产，Gaffer 侧的解析模板
- 问题：[[外部 USD 进入 PYTHONPATH 导致 Houdini 崩溃]] —— 别把这份 pxr 放进全局 PYTHONPATH
- 问题：[[gcc 9 编译 OpenUSD 报未知编译选项]] —— 编译器包装脚本的由来
- 来源：[[来源 - Claude 全局记忆]]

---
type: problem
aliases: [pxr conflict, UsdTyped has not been created yet]
tags: [usd, houdini, python, environment]
applies_to: ["Houdini 21.0.596", "OpenUSD 26.11"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---
# 外部 USD 进入 PYTHONPATH 导致 Houdini 崩溃

## 现象

从终端启动裸装的 [[Houdini]]（不走 rez），启动时报一串模块缺失，然后 terminate 崩溃：

```text
ModuleNotFoundError: No module named 'pxr.CameraUtil'   （GeomUtil / Ndr / PxOsd / UsdMtlx 同样）
husd.UsdHoudini ... extension class wrapper for base class ... UsdTyped has not been created yet
terminate called ...
```

## 原因

shell 的全局 `PYTHONPATH` 里放了自编 [[OpenUSD]] 的 `site-packages`。Houdini 的 Python 先找到了这份外部的 `pxr`，而它有两处和 Houdini 自带的那份不兼容（[[来源 - Claude 全局记忆]]）：

- 它是核心版（编译时 `--no-imaging`），没有 `CameraUtil` / `GeomUtil` / `Ndr` / `PxOsd` / `UsdMtlx`；
- C++ 命名空间不同（Houdini 21.0 是 `pxrInternal_v0_25_5`），Houdini 自己的 USD 插件按它的类型注册找不到基类。

走 [[rez]] 启动的程序不受影响（rez-env 会重置 PYTHONPATH），所以问题只在裸装启动器（如 `Music/launcher/houdini_local_2100.sh`）上出现。

## 解决

- 全局环境里**不设 PYTHONPATH**，只把命令行工具的包装脚本目录加进 PATH：
  ```bash
  export USD_ROOT=$HOME/Music/third_party/usd/current
  export PATH=$HOME/Music/third_party/usd/bin:$PATH
  ```
- 每个 USD 工具由自己的包装脚本只给自己那个进程设 PYTHONPATH；需要 `pxr` 的一次性脚本用 `usd-python` 跑。

## 验证方法

对比去掉和保留 PYTHONPATH 时 Houdini 拿到的 `pxr`：

```bash
env -u PYTHONPATH /opt/hfs21.0/bin/hython -c "import pxr; print(pxr.__file__)"
/opt/hfs21.0/bin/hython -c "import pxr; print(pxr.__file__)"
```

两条输出一样（都指向 `/opt/hfs21.0` 里面）即修好。其他 DCC 报一串 `pxr.*` 缺失加 boost wrapper 错误时，用同样的方法定位。

## 相关

- 实体：[[OpenUSD]] —— 自编的核心版 USD
- 实体：[[Houdini]] —— 自带一份 pxr
- 实体：[[rez]] —— rez 启动会重置 PYTHONPATH
- 实体：[[houdini_mcp]] —— 裸装启动器也用于它的测试
- 来源：[[来源 - Claude 全局记忆]]

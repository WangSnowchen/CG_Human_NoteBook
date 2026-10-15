---
type: entity
aliases: [UE C++ API 索引, UE 反射索引]
tags: [unreal, api, cpp]
applies_to: ["Unreal Engine 5.8"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---
# ue_api

从 [[Unreal Engine]] 源码头文件扫出来的 C++ 反射索引（SQLite + FTS5 全文索引），路径 `Music/third_party/unreal/ue_api/`。扫 `Music/_repos/EpicGames/UnrealEngine` 的 46090 个头文件（203MB，排除 ThirdParty），冷跑 26 秒，库约 108MB（[[来源 - Claude 全局记忆]]）。

## 要点

| 表 | 条数 | 内容 |
|---|---|---|
| `types` | 34113 | `UCLASS` / `USTRUCT` / `UENUM` / `UINTERFACE` |
| `members` | 143145 | `UPROPERTY` / `UFUNCTION` / 枚举取值 |
| `symbols` | 185546 | 所有 class / struct / enum 声明，区分定义和前向声明 |

- **反射信息就是细节面板背后的数据**：`UPROPERTY` 的 `Category` = 面板分组；`meta` 里的 `DisplayName` / `UIMin` / `UIMax` / `ClampMin` / `EditCondition` = 显示名、滑条范围、灰显条件。实测和文档对得上（`UDirectionalLightComponent` 的 `AtmosphereAndCloud` 分组扫出 15 个参数，官方文档那节也是 15 个），而且多给了类型和范围。
- **文档和源码说法不一致时以源码为准**。
- **边界**：
  - 只认反射标记。纯 C++ 成员函数、模板、宏不在 `members` 里，但类型本身在 `symbols` 能查到位置。
  - 默认值大多为空：UE 的 `UPROPERTY` 一般在构造函数里赋初值，要默认值按行号去 `.cpp` 翻构造函数。
  - 带 `_DEPRECATED` 的照样收录（看老工程有用），别当成现役参数。

## 用法 / 关键参数

```bash
cd Music/third_party/unreal/ue_api
python3 api.py type UDirectionalLightComponent -i   # 细节面板全部参数（含继承链）
python3 api.py member LightSourceAngle               # 按成员名查
python3 api.py enum ECastRayTracedShadow             # 枚举取值
python3 api.py cat AtmosphereAndCloud                # 按 Category 查
python3 api.py where FSceneView                      # 类型定义在哪个文件哪一行
python3 api.py grep "cloud shadow"                   # 全文搜注释
python3 api.py find <名字>
python3 _build/build_db.py                           # 重建索引
```

## 实现要点

不用 libclang：UE 头文件带一整套自定义宏，真编译要完整构建环境；而反射标记语法固定，按「找宏 → 配括号 → 读紧随其后的声明 → 往上找文档注释」用正则扫就够准。扫的时候要注意：

- `Category` 的正则要在第一个逗号处收住，否则会把后面的 `AdvancedDisplay`、`meta=` 一起卷进来。
- UENUM 有两种写法：`enum class X : uint8`，以及老式 `UENUM() namespace X { enum Type }`（292 个，引用时写 `X::Type`）。只认前者会漏掉 `ECastRayTracedShadow` 这类。
- `symbols` 里同名的一大半是前向声明（`class FSceneView;` 满仓库都是），要区分定义（后面跟 `{`）并排在前面。
- 同名成员按模块排序：`Runtime/Engine` → 其余 `Runtime` → `Editor` → `Developer` → `Plugins`。这样查 `AutoExposureBias` 第一条就是 `FPostProcessSettings` 里那个；不排序的话先出来的是 nDisplay 插件里的同名成员。
- 行号别逐字符 enumerate 算（203MB 上太慢），用 `text.find("\n")` 走 C 层。

## 相关

- 实体：[[Unreal Engine]] —— 源码所属软件
- 实体：[[ue_docs]] —— 配套的离线指南
- 来源：[[来源 - Claude 全局记忆]]

---
type: synthesis
aliases: [Arnold LPE 速查, Light Path Expression]
tags: [arnold, aov, lpe, rendering]
applies_to: []
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# Arnold AOV 表达式速查

团队 [[lgtLib 共享节点库]] 里用到的 Arnold [[AOV]] 光路表达式（Light Path Expression），可以直接抄进 [[ArnoldAovManager]] 的 manageAovs JSON 的 `expression` 字段。

## 表达式

```text
albedo              C[DSV]A
diffuse             C<RD>A
diffuse_albedo      C<RD>A
specular_direct     C<RS[^\'coat\'\'sheen\']>L
specular_indirect   C<RS[^\'coat\'\'sheen\']>[DSVOB].*
sss                 C<TD>.*
indirect            C[DSV][DSVOB].*
coat_direct         C<RS\'coat\'>L
coat_albedo         C<RS\'coat\'>A
emission            C[LO]
cryptomatte RGBA    C.*
deep                C.*
```

上面是写在 JSON / Python 字符串里的形式，`\'` 是转义的单引号；表达式本身是 `C<RS[^'coat''sheen']>L` 这样。

- 光路记号：`C` 相机，`L` 光源，`O` 自发光物体，`B` 背景；`R` 反射、`T` 透射，`D` 漫反射、`S` 高光、`V` 体积；`A` 表示 albedo 终点；`<RS'coat'>` 限定 coat 这一层的高光反射。
- `specular_direct` / `specular_indirect` 用 `[^'coat''sheen']` 排除 coat 和 sheen 层，这两层单独出 AOV。

## 其它通道

- `opacity`、`transmission_albedo`：直接用同名内置 AOV。
- `P` / `N` / `Pref` / `Z`：数据通道，用 `closest` 滤波（避免采样混色）+ `filterwidth 2.0`。
- **cryptomatte**：`aov_id1..8` 配 crypto（asset / object / material），RGBA 用 `C.*`。
- **自定义 AOV**：在材质 Box 里用 `aov_write_rgb` shader 链（passthrough 串接）把 ID 贴图写进命名 AOV。
- **deep**：JSON 写法见 [[Deep 输出]]。

## 两种管理方式

- **黑名单删减**：`ArnoldAovDeleter` 的 delete 列表；或 `invertNames=True` 只保留列出的（常用于只留 mask / crypto）。
- **白名单重建**：先用 `'*'` 删光，再用 ArnoldAovManager 按白名单重建。

## 相关

- 概念：[[AOV]] —— AOV 的定义
- 实体：[[ArnoldAovManager]] —— 表达式写进它的 JSON
- 实体：[[Arnold]] —— 光路表达式的语法来源
- 实体：[[lgtLib 共享节点库]] —— 配方来源
- 综述：[[Gaffer 渲染设置模板]] —— AOV 在渲染设置里的位置
- 来源：[[来源 - Claude 全局记忆]]

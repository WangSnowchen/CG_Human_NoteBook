---
type: entity
aliases: [Cortex IECoreGL, ToGLConverter, ToGLMeshConverter]
tags: [gaffer, cortex, viewport, opengl, cpp]
applies_to: ["Gaffer 1.7.1.0"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# IECoreGL

Cortex 库里的 OpenGL 渲染层。[[Gaffer]] 视口用它把场景对象（IECoreScene 的网格、点云、曲线）转换成 GL 对象并绘制（[[来源 - Claude 全局记忆]]）。

## 要点

- **转换器注册表**：`ToGLConverter` 的注册项存在一个 multimap 里，`ToGLConverter::create()` 取第一个匹配的项，后注册的同类型转换器不会被选中。匹配按继承关系，子类跟着父类的转换器走（USD `PointInstancer` 读进来的点云是 `IECoreScene::PointsPrimitive` 子类，走 `ToGLPointsConverter`）。
- **`ToGLMeshConverter`**：三角化后把所有 primvar 提升成 FaceVarying，用 `glDrawArrays` 无索引绘制；`IECoreGL::MeshPrimitive` 只收 FaceVarying 和 Constant 两种插值。视口里的网格因此比源数据大约 3 倍，见 [[索引式网格上传]]。
- **`IECoreGL::Primitive` 基类**会把顶点数据拷一份长期留在 CPU。
- **`Primitive::render`** 每个对象一次 `glPushAttrib`、绑两套 Setup、六次 `State::get`。对象上万时这是每帧开销的大头，见 [[Gaffer 视口每帧开销分析]]。
- **`Primitive::shaderSetup()`** 可以覆写来换用派生着色器（`IECoreGL::PointsPrimitive` 就是这么做的）；派生后用 `addParametersToShaderSetup` 重新挂 uniform。
- **`ShaderLoader::create`** 用 boost::wave 预处理着色器源码，不认 `#version 430 compatibility`，见 [[IECoreGL 着色器预处理器不认 version 430]]。
- **`IECoreGL::Buffer(data, size, target)`** 只认 `GL_ARRAY_BUFFER` / `GL_ELEMENT_ARRAY_BUFFER`。SSBO 要自己 `glGenBuffers`，再用 `Buffer(GLuint)` 接管。
- GL 和 Scene 两个命名空间各有一个 `PointsPrimitive`，C++ 里 GL 那个要写全名 `IECoreGL::PointsPrimitive`。
- Gaffer 视口的 `CachedConverter` 按源对象 hash 缓存转换结果，但只在 500 MB 的 LRU 内去重，见 [[Gaffer 视口展开大场景内存暴涨]]。

## 用法 / 关键参数

**替换某个类型的原生转换器**（[[gaffer_indexed_mesh]] 的做法）：`ToGLConverter::registrations()` 是私有静态函数，但符号导出了，可以用 `#define private public` 只包这一个头来拿到它，摘掉原生项后 insert 自己的。

```cpp
// 所有标准库头必须放在 #define private public 之前，
// 否则 <sstream> 之类在它底下展开会报 private 访问权限错误
#include <sstream>
#include <string>

#define private public
#include "IECoreGL/ToGLConverter.h"
#undef private
```

- `uninstall()` 时每一路只在「装过」时才卸：没装就卸会把原生注册项擦成空表。
- 其余对象（灯光 / 相机可视化、原生占位框、非网格、拾取、选中高亮）仍交给 IECoreGL 原样绘制。

## 常见问题

- [[IECoreGL 着色器预处理器不认 version 430]]
- [[Gaffer 视口展开大场景内存暴涨]]

## 相关

- 实体：[[Gaffer]] —— 视口的使用方
- 实体：[[gaffer_indexed_mesh]] —— 替换了它的网格和点云转换器
- 概念：[[索引式网格上传]] —— 原生网格为什么大 3 倍
- 概念：[[视锥剔除]] —— 点云分块后每块仍交 `ToGLPointsConverter` 绘制
- 概念：[[Multi Draw Indirect 批量绘制]] —— 合不了批的对象仍走 IECoreGL
- 问题：[[IECoreGL 着色器预处理器不认 version 430]] —— `ShaderLoader` 的限制
- 问题：[[Gaffer 视口展开大场景内存暴涨]] —— 转换结果体积与 `CachedConverter` 去重范围
- 综述：[[Gaffer 视口每帧开销分析]] —— `Primitive::render` 的逐对象开销
- 来源：[[来源 - Claude 全局记忆]]

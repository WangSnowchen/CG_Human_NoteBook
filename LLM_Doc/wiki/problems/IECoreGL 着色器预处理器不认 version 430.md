---
type: problem
aliases: [ShaderLoader boost wave version 430, IECoreGL ShaderLoader 预处理失败]
tags: [gaffer, cortex, opengl, glsl, cpp]
applies_to: ["Gaffer 1.7.1.0"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# IECoreGL 着色器预处理器不认 version 430

## 现象

在 [[IECoreGL]] 原生着色器的基础上做文本替换生成派生着色器，源码里有 `#version 430 compatibility`，交给 `IECoreGL::ShaderLoader::create` 加载时预处理失败（[[来源 - Claude 全局记忆]]）。

## 原因

`ShaderLoader::create` 用 boost::wave 做预处理，boost::wave 不认 `#version 430 compatibility` 这一行。

## 解决

从 ShaderLoader 拿到的原始着色器源码已经预处理过了，派生着色器不用再过一遍预处理：替换完文本后直接构造 `IECoreGL::Shader` 编译，按源码 hash 缓存。[[gaffer_indexed_mesh]] 的派生着色器（法线在着色器里算、量化位置解码、合批查表）都这样编译，接入方式是覆写 `Primitive::shaderSetup()`，见 [[索引式网格上传]]。

同类限制：`IECoreGL::Buffer(data, size, target)` 只认 `GL_ARRAY_BUFFER` / `GL_ELEMENT_ARRAY_BUFFER`，SSBO 要自己 `glGenBuffers` 后用 `Buffer(GLuint)` 接管。

## 验证方法

派生程序编译通过后，用两个进程分别跑原生和新实现，离屏逐像素对比（判读见 [[视口像素对比的差异是 z-fighting 还是几何错误]]）。量化网格的派生程序失败时对象整个不画，画面上缺东西就说明派生没成功。

## 相关

- 实体：[[IECoreGL]] —— `ShaderLoader` 所在的库
- 实体：[[gaffer_indexed_mesh]] —— 派生着色器的使用方
- 概念：[[索引式网格上传]] —— 派生着色器的接入方式
- 问题：[[视口像素对比的差异是 z-fighting 还是几何错误]] —— 编译通过后怎么验证画面
- 来源：[[来源 - Claude 全局记忆]]

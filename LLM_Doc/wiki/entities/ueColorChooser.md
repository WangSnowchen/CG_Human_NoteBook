---
type: entity
aliases: [UEColorChooser, UE 风格拾色器, ueStyleColorPicker]
tags: [gaffer, gafferui, qt, color, unreal]
applies_to: ["Gaffer 1.6.5.1"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# ueColorChooser

把 [[Unreal Engine]] 编辑器的 `SColorPicker`（`SColorPicker.cpp` 约 1600 行）移植成 [[Gaffer]] 拾色器，替换原生 `GafferUI.ColorChooser` 和弹窗 `ColorChooserDialogue`。纯 Python + Gaffer 自带的 Qt（PySide6 6.5.6），不用编译（[[来源 - Claude 全局记忆]]）。

## 要点

- 文件：`~/gaffer/python/ueColorChooser.py` + `ueStyleColorPicker.py` + `eyeDropper.py` + `~/gaffer/startup/gui/ueColorChooser.py`。UE 参考源：`_repos/EpicGames/UnrealEngine/Engine/Source/Runtime/AppFramework/Private/Widgets/Colors/`。
- 界面：色轮、光谱、SV 竖条、渐变滑条、预览色块、吸管按钮、主题条；最近颜色随文件保存；弹窗按 OK 才提交。
- 吸管跨软件取屏幕颜色，见 [[eyeDropper]]。

## 替换机制

内联的 `ColorChooserPlugValueWidget` 和弹窗 `ColorChooserDialogue` 都在**运行时**调用 `GafferUI.ColorChooser(...)` 构造，所以 startup 里把模块属性换掉一处就全部生效；用 `from xxx import` 绑定的是 import 时的旧类，不受影响。替换类是 `UEColorChooser` + `UEColorChooserDialogue`。整体做法见 [[替换 Gaffer 原生编辑器的方法]]。

### 接口契约（替换类必须实现）

- 方法：`setColor` / `getColor` / `setInitialColor` / `setSwatchesVisible` / `setVisibleComponents` / `setColorFieldStaticComponent` / `setColorFieldVisible` / `setDynamicSliderBackgrounds` / `setErrored`。
- 类方法 `changesShouldBeMerged`：直接委托 `GafferUI.Slider` / `NumericWidget.changesShouldBeMerged`，保证撤销合并和原生一致。
- 6 个信号：`colorChanged` / `visibleComponentsChanged` / `staticComponentChanged` / `colorFieldVisibleChanged` / `dynamicSliderBackgroundsChanged` / `optionsMenu`。

## 实现要点与坑

- **模块级常量用单下划线**（`_MAX_RECENTS`）：类体里的双下划线标识符会被自动加类名前缀。
- **PySide6 `Signal` 必须定义在类体里**；写进 `__init__` 成了实例属性，会报 `Signal has no attribute 'connect'`。
- **子类代理构造**：调 `GafferUI.ColorChooserDialogue.__init__( self, ... )` 时 self 的 MRO 不含替换类，名称重整的方法找不到 → 回调一律用闭包捕获 chooser / self，不用 `Gaffer.WeakMethod( self.__x )`。
- **防无限递归**：`install()` 换名后，类里的 `GafferUI.ColorChooserDialogue.__init__` 会指回自己。类定义时保存原类 `__base = GafferUI.ColorChooserDialogue`，`__init__` 里调它。
- **预览 / 提交分离**：内部 `__color`（正式）+ `__previewColor`（预览），交互只改预览。`commitOnDrag`：内联为 True（松开鼠标提交），弹窗为 False（按 OK 才提交，对应 UE 的 `bOnlyRefreshOnOk`）。弹窗 OK 的提交顺序见 [[Gaffer 拾色器弹窗点 OK 不生效]]。
- 色轮的取色角度见 [[QConicalGradient 色轮取色角度错位]]。
- 延迟 / 重建回调里控件可能已销毁（`QHBoxLayout already deleted`），所有 `QTimer.singleShot( 0 )` 延迟路径包 `try/except RuntimeError`。
- **最近颜色随文件保存**：写 script 节点的元数据 `Gaffer.Metadata.registerValue( script, key, IECore.Color3fVectorData( [...] ), persistent=True )`，随 .gfr 存取；找 script 走 `ancestor( ScriptWindow )`，取不到再用顶层可见的 ScriptWindow。
- 吸管图标用 Gaffer 自带的 `gafferImageUIColorInspectorTool.png`，`IECore.SearchPath( GAFFERUI_IMAGE_PATHS ).find()` 解析。内联模式 `setSwatchesVisible( False )` 时隐藏预览列和主题面板，压缩高度。
- imath 的 `rgb2hsv` / `hsv2rgb` 与 Qt `fromHsv` 结果一致，组件内部统一走 Qt 的 HSV 路径，避免两套混用。

## 测试方法

- 裸 `bin/python3` 跑 GafferUI 不可靠（缺 `colorFieldEmptyIcon.png` 等图形资源，`qEvent.ToolTip` 等兼容问题只在裸环境出现）→ 设 `GAFFERUI_IMAGE_PATHS=$GAFFER/graphics`；沙箱或没有 GPU 时加 `LIBGL_ALWAYS_SOFTWARE=1`。
- 注入不了真实环境时写一个**临时 startup/gui 测试脚本**：`sys.path.insert( 0, ~/gaffer/python )` → import → 断言 → 结果写日志 → `sys.exit( 0 )`，用 `bin/gaffer` 启动后读日志，测完删除。
- 渲染验证：`QMainWindow` 包住目标控件 → `grab().save( png )`。
- 方法论技能：`~/.claude/skills/gaffer-color-chooser/`。

## 常见问题

- [[QConicalGradient 色轮取色角度错位]]
- [[Gaffer 拾色器弹窗点 OK 不生效]]

## 相关

- 实体：[[Gaffer]] —— 所属软件
- 实体：[[Unreal Engine]] —— 移植来源 `SColorPicker`
- 实体：[[eyeDropper]] —— 拾色器里的跨软件吸管
- 实体：[[gaffer-color-chooser-plus]] —— 同样替换原生拾色器的另一个实现
- 实体：[[Qt]] —— 自绘控件所用框架
- 问题：[[QConicalGradient 色轮取色角度错位]] —— 色轮渲染和取色公式要一致
- 问题：[[Gaffer 拾色器弹窗点 OK 不生效]] —— OK 时必须发信号
- 综述：[[替换 Gaffer 原生编辑器的方法]] —— 类名替换机制
- 来源：[[来源 - Claude 全局记忆]]

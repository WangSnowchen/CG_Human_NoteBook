---
type: entity
aliases: [gaffer-light-skill, gaffer-light]
tags: [gaffer, arnold, lighting, ai-agent]
applies_to: ["Gaffer 1.7.1.0"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# gaffer_light_skill

按 color key 或参考图给准备好的 Gaffer 镜头（`.gfr`）搭 Arnold 灯光的技能包，只支持 Gaffer 1.7。灯写进团队的 [[LightSetupManager]]。

```text
Music/third_party/gaffer_my_extensions/gaffer_light_skill/0.1.0/
```

Claude Code 技能 `~/.claude/skills/gaffer-light-skill` 链接到包里，`SKILL.md` 改包里那份。

## 要点

- **两个入口**：
  - `bin/gaffer-light`：无头命令行，另存一份 `_lit.gfr`，并输出预览渲染和并排对照图。
  - `bin/gaffer-light-gui`：启动带 [[gaffer_mcp]] 的 Gaffer，用 `light_*` 系列工具在开着的界面里搭灯（可撤销）。
- **只出一版方案交给人判断**，不自动多轮迭代。
- **方案只写相机相对的意图**：方位角、仰角、主体半径倍数、stops、色温。灯的位置、朝向、exposure 由程序算。
- 灯型取值和行名规则见 [[LightSetupManager]]（团队 group `lgt_grp`，行名形如 `/env/key_10`）。

## 用法 / 关键参数

### Arnold 灯衰减标定

白卡正对灯光实测的亮度系数 k：

| 灯型 | k |
|---|---|
| distant | 1/π |
| skydome | 1 |
| point / spot / quad / disk | 平方反比，k ≈ 1/π（normalize 开） |

### 环境事实

- pj2023dy001 的 OCIO：工作空间 ACEScg，默认显示 ACES 1.0 SDR-video。
- OIIO 没有默认字体，对照图写字用 `$GAFFER_ROOT/fonts/VeraBd.ttf`。
- Gaffer 环境里没有 numpy。
- 主体区域取样用剪影：只留主体和相机、用 `flat` 白色渲一张。用包围盒会把背景也算进去。
- 在 GUI 里需要渲染的步骤一律先存快照，再走命令行渲染。

### 测试

- `tests/run_tests.sh`：无头 152 条。
- `tests/run_tests.sh --gui`：端到端 19 条，用独立端口 24799 和独立状态目录。
- 还没在真实团队镜头上验证过。

## 相关

- 实体：[[LightSetupManager]] —— 灯写入的节点
- 实体：[[gaffer_mcp]] —— GUI 入口依赖的 MCP 桥接
- 实体：[[Arnold]] —— 渲染器，衰减标定针对 Arnold 灯
- 综述：[[Gaffer 1.6 与 1.7 API 差异]] —— 本包只支持 1.7
- 来源：[[来源 - Claude 全局记忆]]

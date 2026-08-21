---
target: apps/public-reader/src
total_score: 21
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
timestamp: 2026-08-21T03-32-40Z
slug: apps-public-reader-src
---
Method: dual-agent (A: 01a0225c-bfa6-7af1-bb51-1710a06e90a0 · B: 01a0225c-df1a-75f2-8bdb-7e69818aa763)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|---:|---|
| 1 | Visibility of System Status | 2 | “服务暂不可用”“工具加载失败”可见，但缺少解释和下一步。 |
| 2 | Match System / Real World | 3 | 电商 AI 语言基本准确，但“Skill”“业务”等入口仍偏内部化。 |
| 3 | User Control and Freedom | 2 | 弹窗可关闭，但移动端和跨页面返回路径仍不够稳。 |
| 4 | Consistency and Standards | 2 | 首页/Skill 是高级暗色系统，工具/指南/文章像另一套轻量门户。 |
| 5 | Error Prevention | 2 | 空工具页仍展示筛选，容易让用户以为功能坏了。 |
| 6 | Recognition Rather Than Recall | 3 | 主要导航清楚，案例卡片可识别，但部分静态标签像按钮。 |
| 7 | Flexibility and Efficiency | 2 | 阅读页有搜索，但主站缺少更快的“找对应 Skill”路径。 |
| 8 | Aesthetic and Minimalist Design | 2 | 核心页面有质感，辅助页面显得未完成。 |
| 9 | Error Recovery | 1 | 失败状态没有恢复建议。 |
| 10 | Help and Documentation | 2 | 有 guide，但不在主导航，视觉和购买安心感不足。 |
| **Total** |  | **21/40** | **Acceptable: 核心方向很好，系统完整度还不够。** |

## Design Specificity Verdict

网站已经有很明确的局部风格：暗色、低密度、真实电商视觉图、Skill 商品页思路，这些很像 AchoudiPost 自己的东西。问题是它还没有完整铺到全站。首页和 `/skills/visual/` 是一个高级的 Lovart 式电商 AI Skill 站；`/guide/`、`/tools/`、`/about/`、文章阅读器更像普通内容门户。

Deterministic scan found 8 warnings: `bounce-easing` 2, `broken-image` 1, `side-tab` 3, `layout-transition` 2. Key files: `SteadyflowReference.astro`, `portal.css`, `global.css`. Browser evidence also confirmed homepage有 1 个空图片候选，`/tools/` 显示“工具加载失败”。Overlay 注入没有成功，所以没有可靠的可视化覆盖层。

## Overall Impression

第一屏和 Skill Modal 是最强资产。现在最值得优化的不是再加新效果，而是把“高级暗色电商 Skill 商品页”的体系贯穿到全站，并把失败/空状态改成可信的产品表达。

## What Works

- 首页首屏有明确记忆点：大标题、作品横向轮播、暗色留白，方向是对的。
- Skill Detail Modal 很接近商品页：Before/After、版本、适合/输入/输出、二维码获取，用户能理解价值。
- 真实电商案例图比抽象插画更有效，适合这个站的转化目标。

## Priority Issues

**[P1] 全站视觉系统断裂**  
Why it matters: 用户从首页进入会感到高级，但进入工具、指南、关于、文章后像换了产品。  
Fix: 把辅助页面也改成同一套暗色编辑系统，或明确把文章阅读定义为独立阅读模式。  
Suggested command: `$impeccable layout`

**[P1] `/tools/` 像失败页，不像产品设计**  
Why it matters: “工具加载失败”会直接削弱信任，尤其顶部还可能显示服务状态异常。  
Fix: 改成“资源工具整理中”的主动空状态，移除暂不可用筛选，给一个返回实战库或联系的动作。  
Suggested command: `$impeccable harden`

**[P1] 移动端和浅色页导航需要再压实**  
Why it matters: 设计审查发现浅色页面上移动导航的可读性风险，属于基础可用性问题。  
Fix: 移动菜单始终使用明确暗色不透明面板、固定层级和高对比 active 状态。  
Suggested command: `$impeccable adapt`

**[P2] Skill 页把最强证据藏进弹窗**  
Why it matters: Before/After 是最能让用户懂价值的东西，但当前要点卡片后才看到。  
Fix: 在 Skill 页面主体直接露出一个精简 Before/After，再让 Modal 做深度查看和获取版本。  
Suggested command: `$impeccable distill`

**[P2] 检测器发现机械质量问题**  
Why it matters: broken image、side-tab、layout-transition、bounce-easing 都会让页面显得没收口。  
Fix: 修空图片节点，替换过度弹跳缓动，避免 layout 属性 transition，检查右侧/侧边悬浮元素。  
Suggested command: `$impeccable polish`

## Persona Red Flags

**Jordan first-time buyer**: 可能不清楚 Skill 是课程、模板、服务还是工具；看到工具失败后会怀疑站点可靠性。

**Riley busy operator**: 想快速判断“我的产品作图问题该用哪个 Skill”，但现在路径仍偏展示，缺少直接分流。

**Casey mobile buyer**: 手机上需要一眼看到证明和下一步，隐藏在弹窗里的信息会降低决策速度。

**Sam accessibility-sensitive user**: 轮播图和图片预览有很多可聚焦元素，若缺少清晰说明和稳定 focus 状态，会增加负担。

## Minor Observations

- `/guide/` 对购买和交付很重要，但不在主导航。
- “业务”作为导航词偏模糊，实际是联系/咨询入口。
- 服务状态文案要么真的接后端，要么改成不制造焦虑的状态。
- 文章阅读器功能强，但视觉语言与首页断层明显。

## Questions to Consider

- 网站第一任务到底是“看案例”“买 Skill”“联系定制”，还是“读内容”？
- `/tools/` 在没有工具前是否应该公开？
- 如果首页只保留“看案例 → 选 Skill → 联系到我”一条路径，会不会更强？

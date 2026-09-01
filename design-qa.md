# 用户入口视觉 QA

## 比较目标

- source visual truth：`C:\Users\chao.liu\AppData\Local\Temp\codex-clipboard-931fb3bd-fd04-4fae-99a0-28bea28161da.png`（用户提交的当前线上截图，2550 × 1328，包含浏览器地址栏）
- interaction reference：`C:\Users\chao.liu\AppData\Local\Temp\codex-clipboard-dd691c0c-8ece-430d-86b8-a8f90fc9f61c.png`、`C:\Users\chao.liu\AppData\Local\Temp\codex-clipboard-5ce6bd41-a835-4719-bd13-c201f7d13526.png`
- implementation screenshot：`C:\Users\chao.liu\Documents\Codex\2026-08-17\ba\work\user-menu-harness-icons-final.png`（826 × 984）
- 实现来自生产 `public/platform-auth.js`，在本地视觉验收页中使用模拟管理员响应，并在 700 ms 后模拟旧版解包器替换 `document` 根节点。

## 尺寸与状态

- implementation CSS viewport：826 × 986；截图像素：826 × 984；devicePixelRatio：1.25；截图由浏览器视口直接捕获，无二次缩放。
- source 像素：2550 × 1328；比较时排除浏览器地址栏和滚动条，只比较页面内容，未将浏览器 chrome 当作产品 UI。
- 状态：管理员已登录，用户菜单展开；显示名“系统管理员”、账号 `admin`、角色“管理员”、状态“后端正常”。

## 比较证据

- full-view：source 全页截图确认问题位于右上角全局 topbar，implementation 全视口截图确认菜单没有遮挡主内容、没有产生横向溢出；由于本次改动只针对用户入口，不以不相关的教学页内容做像素级一致性判断。
- focused region：将两张截图作为同一轮比较输入，聚焦右上角 topbar 与下拉面板，检查触发器尺寸、头像、状态标签、面板定位、分隔线、三项操作和图标。最终实现显示为深色圆角触发器、青绿色圆形头像、绿色状态标签、白色圆角面板和真实 SVG 图标，解决了原截图中的裸露链接文本。

## Findings

最终没有可操作的 P0/P1/P2 视觉问题。

### 必查 fidelity surfaces

- Fonts and typography：使用平台现有系统字体栈；触发器为 13 px 中等字重，面板姓名/角色/账号形成明确层级，长显示名使用省略号，不再与账号拼接成一行乱码。
- Spacing and layout rhythm：触发器为 44 px 最小高度，头像 30 px，面板宽 255 px，菜单项间距和面板内边距稳定；面板锚定触发器右侧，窄屏通过媒体查询收窄姓名并隐藏状态标签。
- Colors and visual tokens：深藏蓝触发器、青绿色头像、浅绿色健康状态和白色面板延续用户提供的参考状态；边框、圆角和阴影用于区分全局入口与菜单内容。
- Image quality and asset fidelity：头像、下拉箭头、设置、锁和退出图标均使用独立 SVG 资源（`public/icons/*.svg`），不是文字 glyph、emoji 或 CSS 绘图；截图中图标清晰且尺寸一致。
- Copy and content：菜单文案为“用户管理”“修改密码”“退出登录并切换用户”，并显示“管理员”和 `admin`，与现有用户管理流程一致。
- Accessibility and states：触发器为 button，菜单项使用 menuitem 语义，提供中文 aria-label、展开状态和 focus-visible 外框；展开/收起与退出登录行为由回归用例覆盖。

## Comparison history

1. `[P1]` 原始认证桥接脚本把管理员信息和链接直接作为未样式文本插入 topbar。修复：新增结构化用户触发器、状态标签、白色下拉面板和菜单操作；通过展开态截图复核。
2. `[P2]` 显示名、角色和账号缺少层级，导致右上角内容粘连。修复：身份区域改为纵向布局，账号单独显示为 badge；最终截图中姓名与角色分行，账号位于右侧。
3. `[P2]` 旧版解包器替换整个 document 根节点后会移除样式和菜单。修复：样式节点和用户菜单均支持重新注入，MutationObserver 监听 `document`，并保留短时 placement retry；回归测试模拟根节点替换后通过。
4. `[P2]` 头像、姓名和状态的 CSS 选择器原先使用了与实际 class 不一致的 ID 选择器，头像宽度被压为 0。修复：统一为 class 选择器；最终截图核对头像为 30 × 30、图标为 16 × 16、状态标签可见。

## Implementation checklist

- [x] 右上角入口使用结构化、可点击的用户菜单
- [x] 管理员入口、修改密码、退出登录并切换用户均保留
- [x] 姓名、角色、账号和后端状态有清晰层级
- [x] 真实 SVG 图标资源已随生产构建发布
- [x] 根节点重绘后样式和菜单可恢复
- [x] 展开态与响应式窄屏规则已覆盖
- [x] focused screenshot 已在最终 class selector 修复后重新捕获

## Follow-up polish

- [P3] 如后续需要支持更长的真实姓名，可继续根据产品字体和翻译长度微调触发器最大宽度；当前已有省略号和窄屏降级策略，不阻塞验收。

final result: passed

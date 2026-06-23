# AI Pose Feedback Platform

一个面向《运动技能学习与控制》课堂的 AI 反馈教学平台原型。项目使用浏览器摄像头与 MediaPipe Pose 实时识别身体关键点，展示姿态对称性、关节角度和检测报告，帮助学生把抽象的运动控制概念转化为可观察的数据反馈。

## 功能

- 课程展示首页：介绍 AI 反馈进入课堂的教学场景和核心模块
- 实时姿态识别：调用摄像头并在画布上叠加骨架、关键点和角度标签
- 姿态指标分析：计算肩部/髋部对称性、膝/肘/踝/髋角度等指标
- 报告导出：检测结束后生成中文文本报告，包含关键发现和训练建议
- 响应式界面：基于 React、Tailwind CSS 和 Radix UI 组件构建

## 技术栈

- React 19
- TypeScript
- Vite
- Tailwind CSS
- MediaPipe Pose
- Radix UI
- Lucide React

## 本地运行

```bash
npm install
npm run dev
```

生产构建：

```bash
npm run build
```

代码检查：

```bash
npm run lint
```

## 路由

- `/`：项目首页
- `/pose-analysis`：实时姿态识别与分析页面
- `/platform.html`：静态教学平台入口页

## 注意

姿态识别页面需要浏览器摄像头权限，并依赖 MediaPipe 资源加载。建议在 HTTPS 或本地开发环境中使用。

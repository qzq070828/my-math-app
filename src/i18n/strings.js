// 界面文案 - 中文 key，一眼知道是什么
//
// 值可以是字符串，也可以是函数（需要插变量的情况）。
// 缺 key 时自动回退到中文，不会显示空白。

export const 支持语言 = [
  { 代码: "zh", 名称: "中文", 简称: "ZH" },
  { 代码: "en", 名称: "English", 简称: "EN" },
];

export const 文案 = {
  zh: {
    // ——— 导航 ———
    首页: "首页",
    "2D 图形": "2D 图形",

    // ——— 首页 ———
    标题前: "把近似",
    标题重点: "看",
    标题后: "成一件",
    标题次行: "会动的事",
    "打开 2D 图形": "打开 2D 图形",
    导数与切线: "导数与切线",
    黎曼和积分: "黎曼和积分",
    泰勒展开: "泰勒展开",

    // ——— 函数输入 ———
    "输入函数 y =": "输入函数 y =",
    "+ 添加函数": "+ 添加函数",
    "例如: sin(x)": "例如: sin(x)",
    选择颜色: "选择颜色",
    删除这个函数: "删除这个函数",
    空表达式: "（空）",

    // ——— 导数与切线 ———
    显示导数: "显示导数 f′(x)（虚线）",
    显示切线: "显示切线",
    "范围 ±": "范围 ±",
    临界点: " ← 临界点",
    无定义: "无定义",
    追踪函数: "追踪函数（看曲线怎么长出来）",
    追踪切线: "追踪切线（看斜率怎么变）",

    // ——— 错误提示 ———
    多了右括号: "多了一个右括号 )",
    少了右括号: (n) =>
      n === 1 ? "少了一个右括号 )" : `少了 ${n} 个右括号 )`,
    不认识但有建议: (词, 建议) => `不认识 ${词}，你是想输 ${建议} 吗？`,
    不认识: (词) => `不认识 ${词}，检查一下拼写`,
    算式没写完: "算式还没写完",
    解析不了: "这个算式解析不了，检查一下写法",

    // ——— 积分 ———
    "∫ 积分": "∫ 积分",
    定积分: "定积分（黎曼和逼近）",
    矩形高取: "矩形高取",
    左端点: "左端点",
    右端点: "右端点",
    中点: "中点",
    逼近中: "逼近中…",
    开始逼近: "▶ 开始逼近",
    积分标题: (a, b) => `∫ 从 ${a} 到 ${b}`,
    端点说明: (范围, 端点名) => `（${范围}，${端点名}）`,
    端点方式说明: (端点名) => `（${端点名}）`,
    黎曼和: "黎曼和",
    无法计算: "无法计算",
    答案: "答案",
    误差: "误差",

    // ——— 泰勒 ———
    "≈ 泰勒展开": "≈ 泰勒展开",
    "展开点 a =": "展开点 a =",
    "阶数 n =": "阶数 n =",
    暂停: "⏸ 暂停",
    播放: "▶ 播放",
    零阶提示: "零阶是一条水平线 y = f(a)",
    一阶提示: "一阶泰勒就是切线",
    显示误差区域: "显示误差区域（填充色）",
    显示准确度区间: "显示准确度区间",
    误差容限: "误差容限",

    // ——— 泰勒读数 ———
    算不出来: (式) => `${式} 的泰勒展开算不出来`,
    展开说明: (式, a, 阶) => `${式} 在 a = ${a} 处展开到 ${阶} 阶`,
    展开参数: (a, 阶) => `a = ${a}，展开到 ${阶} 阶`,
    这一项: "这一项",
    这项为零: "0 —— 这一项不影响曲线",
    字母式: "字母式",
    数字式: "数字式",
    "在 x =": "在 x =",
    处比较: "处比较",
    "真值 f(x)": "真值 f(x)",
    近似: (阶) => `近似 P${阶}(x)`,
    容差区间说明: (容差) => `误差 ≤ ${容差} 的区间：`,
    宽: (值) => `，宽 ${值}`,
    未越界: "（扫描范围内未越界，实际更宽）",
    区间太窄: "区间太窄，图上几乎看不见 —— 试试提高阶数或放宽容差",

    // ——— 布局 ———
    展开泰勒数据: "▤ 展开泰勒数据",
    详细数据: "详细数据",
    泰勒展开数据: "泰勒展开数据",
    关闭抽屉: "关闭，回到函数编辑",
  },

  en: {
    // ——— 导航 ———
    首页: "Home",
    "2D 图形": "2D Graph",

    // ——— 首页 ———
    标题前: "Make approximation ",
    标题重点: "visible",
    标题后: "",
    标题次行: "— and watch it move",
    "打开 2D 图形": "Open 2D Graph",
    导数与切线: "Derivatives & tangent lines",
    黎曼和积分: "Riemann sum integration",
    泰勒展开: "Taylor expansion",

    // ——— 函数输入 ———
    "输入函数 y =": "Enter function y =",
    "+ 添加函数": "+ Add function",
    "例如: sin(x)": "e.g. sin(x)",
    选择颜色: "Choose color",
    删除这个函数: "Delete this function",
    空表达式: "(empty)",

    // ——— 导数与切线 ———
    显示导数: "Show derivative f′(x) (dashed)",
    显示切线: "Show tangent line",
    "范围 ±": "Range ±",
    临界点: " ← critical point",
    无定义: "undefined",
    追踪函数: "Trace curve (watch it draw)",
    追踪切线: "Trace tangent (watch the slope change)",

    // ——— 错误提示 ———
    多了右括号: "Extra closing parenthesis )",
    少了右括号: (n) =>
      n === 1
        ? "Missing a closing parenthesis )"
        : `Missing ${n} closing parentheses )`,
    不认识但有建议: (词, 建议) =>
      `Don't recognize "${词}" — did you mean ${建议}?`,
    不认识: (词) => `Don't recognize "${词}" — check the spelling`,
    算式没写完: "Expression isn't finished",
    解析不了: "Can't read this expression — check the syntax",

    // ——— 积分 ———
    "∫ 积分": "∫ Integral",
    定积分: "Definite integral (Riemann sum)",
    矩形高取: "Rectangle height",
    左端点: "Left endpoint",
    右端点: "Right endpoint",
    中点: "Midpoint",
    逼近中: "Approximating…",
    开始逼近: "▶ Start",
    积分标题: (a, b) => `∫ from ${a} to ${b}`,
    端点说明: (范围, 端点名) => `(${范围}, ${端点名})`,
    端点方式说明: (端点名) => `(${端点名})`,
    黎曼和: "Riemann sum",
    无法计算: "can't compute",
    答案: "Answer",
    误差: "Error",

    // ——— 泰勒 ———
    "≈ 泰勒展开": "≈ Taylor",
    "展开点 a =": "Center a =",
    "阶数 n =": "Order n =",
    暂停: "⏸ Pause",
    播放: "▶ Play",
    零阶提示: "Order 0 is the horizontal line y = f(a)",
    一阶提示: "Order 1 is exactly the tangent line",
    显示误差区域: "Shade the error region",
    显示准确度区间: "Show accuracy interval",
    误差容限: "Tolerance",

    // ——— 泰勒读数 ———
    算不出来: (式) => `Can't expand ${式}`,
    展开说明: (式, a, 阶) => `${式} expanded at a = ${a} to order ${阶}`,
    展开参数: (a, 阶) => `a = ${a}, order ${阶}`,
    这一项: "This term",
    这项为零: "0 — this term doesn't change the curve",
    字母式: "Symbolic",
    数字式: "Numeric",
    "在 x =": "At x =",
    处比较: "compare",
    "真值 f(x)": "Exact f(x)",
    近似: (阶) => `Approx. P${阶}(x)`,
    容差区间说明: (容差) => `Interval where error ≤ ${容差}:`,
    宽: (值) => `, width ${值}`,
    未越界: "(never exceeded within scan range — actually wider)",
    区间太窄: "Interval too narrow to see — raise the order or loosen tolerance",

    // ——— 布局 ———
    展开泰勒数据: "▤ Taylor data",
    详细数据: "Details",
    泰勒展开数据: "Taylor expansion data",
    关闭抽屉: "Close and go back to editing",
  },
};


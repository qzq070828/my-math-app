// LaTeX 生成 - 把「程序员写法」翻译成教科书排版
//
// 所有要进 KaTeX 的字符串都从这里出，不散落在各个组件里手拼。
import { parse } from "mathjs";
import { 预处理表达式 } from "./symbolicDerivative";
import { 精确Tex } from "./exact";

// 用户输入的表达式 → LaTeX（sin(x) → \sin\left(x\right)，x^2 → x^{2}）
// 预处理必须和求值走同一套，否则屏幕上显示的和算的就不是同一个函数
export function 表达式转Tex(表达式) {
  try {
    return parse(预处理表达式(表达式)).toTex();
  } catch {
    return null;
  }
}

// 数字 → LaTeX：整数原样；常规小数保留有效位；
// 科学计数法换成 ×10^ 的形式（7.5e-5 → 7.5 \times 10^{-5}）
export function 数字转Tex(值, 位数 = 4) {
  if (!Number.isFinite(值)) return "?";
  if (Math.abs(值 - Math.round(值)) < 1e-10) return String(Math.round(值));
  const 文本 = String(Number(值.toPrecision(位数)));
  const e位置 = 文本.indexOf("e");
  if (e位置 === -1) return 文本;
  const 尾数 = 文本.slice(0, e位置);
  const 指数 = Number(文本.slice(e位置 + 1));
  return `${尾数} \\times 10^{${指数}}`;
}

// 数字 → LaTeX 的精确版：值能认成 π/e/√ 的简单倍数（且在允许基内）
// 就用符号式（π/2、√2/2），认不出退回 数字转Tex。
// 基 来自 提取允许基：用户输入过什么符号，这里才允许显示什么符号。
export function 精确数字Tex(值, 基, 位数 = 4) {
  if (!Number.isFinite(值)) return "?";
  const 精 = 精确Tex(值, 基);
  return 精 ?? 数字转Tex(值, 位数);
}

// (x - a) 的 LaTeX 写法：a=0 时就是 x，a<0 时是 (x + |a|)。
// a 给出精确式时（a = π/2），括号里同样是符号式：(x - π/2)
export function 变量Tex(a, 基 = null) {
  if (Math.abs(a) < 1e-12) return "x";
  const 量 = 基 ? 精确数字Tex(Math.abs(a), 基) : 数字转Tex(Math.abs(a));
  return `(x ${a > 0 ? "-" : "+"} ${量})`;
}

// f 的第 k 阶导数记号：f(a)、f'(a)、f''(a)、f'''(a)、f^{(4)}(a)
export function 导数记号Tex(k, 自变量 = "a") {
  const 撇 = k === 0 ? "" : k <= 3 ? "'".repeat(k) : `^{(${k})}`;
  return `f${撇}(${自变量})`;
}

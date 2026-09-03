// 表达式解析 - 把用户输入的字符串转成可计算的函数
import { compile } from "mathjs";

// 预处理 - 把用户的习惯写法转成 mathjs 认识的写法
export function 预处理(表达式字符串) {
  let 结果 = 表达式字符串;

  // 数学符号写法 → mathjs 写法（手打的符号；键盘插入的 pi/sqrt 本来就是 ASCII）
  // π 要先于 √ 处理：√π → √pi → sqrt(pi)，顺序反了 √ 抓不到 pi
  结果 = 结果.replace(/π/g, "pi");
  结果 = 结果.replace(/√\s*\(/g, "sqrt("); // √(x+1)
  结果 = 结果.replace(/√\s*(\d+(?:\.\d+)?|[a-zA-Z]+)/g, "sqrt($1)"); // √2、√x
  结果 = 结果.replace(/÷/g, "/").replace(/×/g, "*").replace(/−/g, "-");

  // ln(...) → LNTEMP(...)  先占位，避免和下面 log 替换冲突
  结果 = 结果.replace(/\bln\(/g, "LNTEMP(");

  // log(...) → log10(...)  数学惯例：log 指以 10 为底
  结果 = 结果.replace(/\blog\(/g, "log10(");

  // 还原：LNTEMP(...) → log(...)  mathjs 的 log 是自然对数
  结果 = 结果.replace(/\bLNTEMP\(/g, "log(");

  // |...| → abs(...)
  结果 = 结果.replace(/\|([^|]+)\|/g, "abs($1)");

  return 结果;
}

// 解析结果只依赖表达式字符串，和调用方、调用时机无关 → 可以安全缓存。
// 没缓存之前：Canvas2D 每帧、FunctionRow 每次 render、两个读数面板
// 各自把同一个式子 compile 一遍，鼠标每动一下就白编译好几次。
// 上限防内存膨胀：淘汰最早进缓存的那条。
const 缓存上限 = 50;
const 解析缓存 = new Map();

// 解析函数表达式
// 参数：表达式字符串，如 "sin(x)" 或 "ln(x)" 或 "|x|"
// 返回：{ 成功: true, 计算函数 } 或 { 成功: false, 错误信息 }
export function 解析表达式(表达式字符串) {
  const 命中 = 解析缓存.get(表达式字符串);
  if (命中) return 命中;

  let 结果;
  try {
    // 先预处理，把 ln、|x| 等转成 mathjs 认识的写法
    const 处理后 = 预处理(表达式字符串);

    const 编译结果 = compile(处理后);
    const 计算函数 = (x) => {
      const y = 编译结果.evaluate({ x: x });
      // 健壮性检查：确保算出来的是数字
      // 输入不完整时（如只打了 "log"），mathjs 会返回函数对象而非数字，
      // 这里把非数字统一转成 NaN，保证往下游传的都是干净的数字。
      return typeof y === "number" ? y : NaN;
    };

    结果 = { 成功: true, 计算函数: 计算函数 };
  } catch (错误) {
    结果 = { 成功: false, 错误信息: 错误.message };
  }

  // 失败的解析同样缓存：半截输入每敲一个键都会重试，
  // 「这个字符串解析不了」这个结论也是纯函数。
  if (解析缓存.size >= 缓存上限) 解析缓存.delete(解析缓存.keys().next().value);
  解析缓存.set(表达式字符串, 结果);
  return 结果;
}

// 解析常量表达式 - 给数字输入框用：允许打 "pi/2"、"π/2"、"sqrt(2)"、"e" 当参数
//
// 和 解析表达式 的区别：作用域是空的，式子里出现 x 之类未知数直接判失败
// （数字框里打 x 没有含义），返回数字或 null。
const 常量缓存 = new Map();

export function 解析常量表达式(文本) {
  const 键 = String(文本 ?? "").trim();
  if (!键) return null;
  if (常量缓存.has(键)) return 常量缓存.get(键);

  let 值 = null;
  try {
    const v = compile(预处理(键)).evaluate({});
    if (typeof v === "number" && Number.isFinite(v)) 值 = v;
  } catch {
    值 = null;
  }

  if (常量缓存.size >= 缓存上限) 常量缓存.delete(常量缓存.keys().next().value);
  常量缓存.set(键, 值);
  return 值;
}

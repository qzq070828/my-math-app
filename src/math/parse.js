// 表达式解析 - 把用户输入的字符串转成可计算的函数
import { compile } from "mathjs";

// 预处理 - 把用户的习惯写法转成 mathjs 认识的写法
// 预处理 - 把用户的习惯写法转成 mathjs 认识的写法
export function 预处理(表达式字符串) {
  let 结果 = 表达式字符串;

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


// 解析函数表达式
// 参数：表达式字符串，如 "sin(x)" 或 "ln(x)" 或 "|x|"
// 返回：{ 成功: true, 计算函数 } 或 { 成功: false, 错误信息 }
export function 解析表达式(表达式字符串) {
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


    return { 成功: true, 计算函数: 计算函数 };
  } catch (错误) {
    return { 成功: false, 错误信息: 错误.message };
  }
}



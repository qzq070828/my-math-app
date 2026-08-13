// 表达式检查 - 在真正解析之前给出「人话」错误提示
//
// 为什么不用 mathjs 自己的报错：它说 "Unexpected end of expression"，
// 学生看不懂。自己检查能说出「少了一个右括号」这种话。

// mathjs 认识的常用函数名
const 已知函数 = [
  "sin", "cos", "tan", "cot", "sec", "csc",
  "asin", "acos", "atan", "sinh", "cosh", "tanh",
  "sqrt", "cbrt", "abs", "exp", "log", "ln", "log10", "log2",
  "floor", "ceil", "round", "sign", "max", "min", "pow",
];

// 学生常打错的写法 → 正确写法
const 常见错写 = {
  tg: "tan",
  ctg: "cot",
  arcsin: "asin",
  arccos: "acos",
  arctan: "atan",
  lg: "log10",
  sen: "sin",
  tang: "tan",
  root: "sqrt",
  squareroot: "sqrt",
};

// 返回错误提示字符串；没问题返回 null
export function 检查表达式(原文) {
  const 文本 = (原文 || "").trim();
  if (!文本) return null; // 空输入不算错

  // 括号配对
  let 深度 = 0;
  for (const 字符 of 文本) {
    if (字符 === "(") 深度++;
    if (字符 === ")") 深度--;
    if (深度 < 0) return "多了一个右括号 )";
  }
  if (深度 > 0) {
    return 深度 === 1 ? "少了一个右括号 )" : `少了 ${深度} 个右括号 )`;
  }

  // 认不出的字母串：可能是打错的函数名
  const 词列表 = 文本.match(/[a-zA-Z]+/g) || [];
  for (const 词 of 词列表) {
    const 小写 = 词.toLowerCase();
    if (小写 === "x" || 小写 === "e" || 小写 === "pi") continue;
    if (已知函数.includes(小写)) continue;
    if (常见错写[小写]) return `不认识 ${词}，你是想输 ${常见错写[小写]} 吗？`;
    return `不认识 ${词}，检查一下拼写`;
  }

  // 结尾是运算符：通常是还没打完
  if (/[+\-*/^(]$/.test(文本)) return "算式还没写完";

  return null;
}

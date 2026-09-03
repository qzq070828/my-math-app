// 数字输入框 - 允许中间态（"-"、""、"1."），也允许常量表达式（"pi/2"、"sqrt(2)"）
//
// 为什么不能直接 value={数} + onChange={Number(...)}：
// 打「-2」时第一个字符是 "-"，Number("-") 是 NaN；清空时 Number("") 是 0。
// 受控组件会立刻把框子拉回旧值，负号和退格都打不进去。
//
// 解法：编辑期间显示「草稿」原文，只在能解析成有限数时才往上提交。
// 失焦时丢掉草稿，回到外部值 —— 半截的 "1." 不会留在界面上。
//
// 常量表达式：type 必须是 text 才能装下 "pi/2"（number 框只收数字字符）。
// 提交时把「原文」一起交上去（提交(数, 原文)）：打了 pi/2 的框
// 失焦后仍显示 pi/2；滑块把值拖走后原文自动失效，回落成数字。
import { useState } from "react";
import { 解析常量表达式 } from "../../math/parse";

// 纯数字（含科学计数法）不必存原文 —— 数字格式化后和原文长一样
const 纯数字 = /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/;

function NumberInput({ 值, 提交, 原文, step = "0.1", min, max, style, className }) {
  // null 表示没在编辑，显示外部传进来的值
  const [草稿, 设置草稿] = useState(null);

  // 原文（如 "pi/2"）和当前值还吻合就显示原文；
  // 滑块把值拖走后对不上，自动回落成格式化数字，不会留着过期符号
  const 原文数 = 原文 ? 解析常量表达式(原文) : null;
  const 原文有效 =
    原文数 !== null &&
    Number.isFinite(值) &&
    Math.abs(原文数 - 值) < 1e-9;
  const 外部文本 = 原文有效
    ? 原文
    : Number.isFinite(值)
      ? String(Number(值.toFixed(3)))
      : "";
  const 显示值 = 草稿 !== null ? 草稿 : 外部文本;

  function 处理输入(事件) {
    const 文本 = 事件.target.value;
    设置草稿(文本);

    // 空串和纯 "-" 是合法的中间态，留着不提交
    if (文本.trim() === "") return;

    let 数 = Number(文本);
    if (!Number.isFinite(数)) {
      // 不是普通数字 → 试试常量表达式（pi/2、π/2、sqrt(2)、e^2）
      const 常量 = 解析常量表达式(文本);
      if (常量 === null) return;
      数 = 常量;
    }

    const 净文本 = 文本.trim();
    提交(数, 纯数字.test(净文本) ? null : 净文本);
  }

  return (
    <input
      type="text"
      inputMode="decimal"
      className={className || "输入框"}
      step={step}
      min={min}
      max={max}
      value={显示值}
      onChange={处理输入}
      onBlur={() => 设置草稿(null)}
      style={style}
    />
  );
}

export default NumberInput;

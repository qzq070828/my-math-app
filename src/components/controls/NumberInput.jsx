// 数字输入框 - 允许中间态（"-"、""、"1."）
//
// 为什么不能直接 value={数} + onChange={Number(...)}：
// 打「-2」时第一个字符是 "-"，Number("-") 是 NaN；清空时 Number("") 是 0。
// 受控组件会立刻把框子拉回旧值，负号和退格都打不进去。
//
// 解法：编辑期间显示「草稿」原文，只在能解析成有限数时才往上提交。
// 失焦时丢掉草稿，回到外部值 —— 半截的 "1." 不会留在界面上。
import { useState } from "react";

function NumberInput({ 值, 提交, step = "0.1", min, max, style, className }) {
  // null 表示没在编辑，显示外部传进来的值
  const [草稿, 设置草稿] = useState(null);

  const 外部文本 = Number.isFinite(值) ? String(Number(值.toFixed(3))) : "";
  const 显示值 = 草稿 !== null ? 草稿 : 外部文本;

  function 处理输入(事件) {
    const 文本 = 事件.target.value;
    设置草稿(文本);

    // 空串和纯 "-" 是合法的中间态，留着不提交
    if (文本.trim() === "") return;
    const 数 = Number(文本);
    if (Number.isFinite(数)) 提交(数);
  }

  return (
    <input
      type="number"
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

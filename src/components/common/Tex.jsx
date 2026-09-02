// KaTeX 渲染组件 - 把 LaTeX 源码排成真正的数学公式
//
// 用法：<Tex 源码="\\frac{f''(a)}{2!}" /> 或 <Tex 块 源码={...} />
// throwOnError: false —— 半截公式最多显示成红色源码，绝不会让界面崩掉。
import { useMemo } from "react";
import katex from "katex";

function Tex({ 源码, 块 = false, style, className = "" }) {
  const html = useMemo(
    () =>
      katex.renderToString(String(源码 ?? ""), {
        throwOnError: false,
        displayMode: 块,
        strict: false,
      }),
    [源码, 块]
  );

  return (
    <span
      className={(块 ? "tex 块式" : "tex") + (className ? " " + className : "")}
      style={style}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export default Tex;

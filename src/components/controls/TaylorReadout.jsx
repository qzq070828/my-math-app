// 泰勒读数 - 系数表 + 字母式 + 数字式 + 点对比
//
// 系数表把「公式是怎么拼出来的」摊开：每一行是 f⁽ᵏ⁾(a) 除以 k! 得到 aₖ，
// 最后一列是这一项的实际写法。学生对着表能自己把公式拼回去。

import { 解析表达式 } from "../../math/parse";
import { 取泰勒 } from "../../math/taylor";
import { 求容差区间 } from "../../math/errorInterval";

function 格式(值, 位数 = 4) {
  if (!Number.isFinite(值)) return "—";
  if (Math.abs(值 - Math.round(值)) < 1e-10) return String(Math.round(值));
  return 值.toPrecision(位数);
}

function 变量写法(a) {
  if (Math.abs(a) < 1e-12) return "x";
  return `(x ${a > 0 ? "-" : "+"} ${格式(Math.abs(a))})`;
}

function TaylorReadout({ 函数列表, 更新函数 }) {
  const 要显示的 = 函数列表.filter((项) => 项.显示泰勒 && 项.表达式);
  if (要显示的.length === 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {要显示的.map((项) => {
        let 计算函数 = null;
        try {
          const 解析结果 = 解析表达式(项.表达式);
          计算函数 = 解析结果 && 解析结果.成功 ? 解析结果.计算函数 : null;
        } catch {
          计算函数 = null;
        }

        const a = Number.isFinite(项.展开点a) ? 项.展开点a : 0;
        const n = Number.isFinite(项.泰勒阶数) ? 项.泰勒阶数 : 1;
        const 对比x = Number.isFinite(项.对比点x) ? 项.对比点x : 1;

        let 泰勒 = null;
        if (计算函数) {
          try {
            泰勒 = 取泰勒(项.表达式, 计算函数, a, n);
          } catch {
            泰勒 = null;
          }
        }

        if (!泰勒 || !泰勒.可用) {
          return (
            <div
              key={项.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "1rem",
                color: "#999",
              }}
            >
              {项.表达式} 的泰勒展开算不出来
              {泰勒 && 泰勒.原因 ? ` —— ${泰勒.原因}` : ""}
            </div>
          );
        }

        // 点对比
        let 真值 = NaN;
        try {
          真值 = 计算函数(对比x);
        } catch {
          真值 = NaN;
        }
        const 近似值 = 泰勒.求值(对比x);
        const 绝对误差 = Math.abs(真值 - 近似值);
        const 相对误差 =
          Number.isFinite(真值) && Math.abs(真值) > 1e-12
            ? (绝对误差 / Math.abs(真值)) * 100
            : NaN;

        // 容差区间
        let 区间 = null;
        if (项.显示容差区间) {
          try {
            区间 = 求容差区间(计算函数, 泰勒, 项.容差 || 1e-3);
          } catch {
            区间 = null;
          }
        }

        const 变量 = 变量写法(a);

        return (
          <div
            key={项.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: "8px",
              padding: "1rem",
              background: "#fff",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontWeight: "bold",
                fontSize: "1.05rem",
                marginBottom: "0.75rem",
              }}
            >
              <span
                style={{
                  width: "0.9rem",
                  height: "0.9rem",
                  borderRadius: "50%",
                  background: 项.颜色,
                  display: "inline-block",
                }}
              />
              {项.表达式} 在 a = {格式(a)} 处展开到 {泰勒.有效阶} 阶
            </div>

            {/* 系数表 */}
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.9rem",
                fontFamily: "monospace",
                marginBottom: "1rem",
              }}
            >
              <thead>
                <tr style={{ background: "#f5f5f5" }}>
                  <th style={单元格}>k</th>
                  <th style={单元格}>f⁽ᵏ⁾(a)</th>
                  <th style={单元格}>k!</th>
                  <th style={单元格}>aₖ = f⁽ᵏ⁾(a)/k!</th>
                  <th style={单元格}>这一项</th>
                </tr>
              </thead>
              <tbody>
                {泰勒.系数.map((系数值, k) => (
                  <tr key={k}>
                    <td style={单元格}>{k}</td>
                    <td style={单元格}>{格式(泰勒.导数值[k])}</td>
                    <td style={单元格}>{泰勒.阶乘表[k]}</td>
                    <td style={单元格}>{格式(系数值)}</td>
                    <td style={单元格}>
                      {格式(系数值)}
                      {k === 0 ? "" : k === 1 ? 变量 : `${变量}^${k}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* 两种公式 */}
            <div style={公式块}>
              <div style={{ color: "#666", fontSize: "0.8rem" }}>字母式</div>
              <div style={{ fontFamily: "monospace", marginTop: "0.2rem" }}>
                P{泰勒.有效阶}(x) = {泰勒.字母公式}
              </div>
            </div>

            <div style={{ ...公式块, marginTop: "0.5rem" }}>
              <div style={{ color: "#666", fontSize: "0.8rem" }}>数字式</div>
              <div style={{ fontFamily: "monospace", marginTop: "0.2rem" }}>
                P{泰勒.有效阶}(x) = {泰勒.数字公式}
              </div>
            </div>

            {/* 点对比 */}
            <div
              style={{
                marginTop: "1rem",
                paddingTop: "0.75rem",
                borderTop: "1px solid #eee",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  fontSize: "0.9rem",
                  marginBottom: "0.5rem",
                }}
              >
                <span>在 x =</span>
                <input
                  type="number"
                  step="0.1"
                  value={Number(对比x.toFixed(3))}
                  onChange={(事件) =>
                    更新函数(项.id, "对比点x", Number(事件.target.value))
                  }
                  style={{ width: "5rem", padding: "0.2rem" }}
                />
                <span>处比较</span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "0.5rem",
                  fontFamily: "monospace",
                  fontSize: "0.95rem",
                }}
              >
                <div style={数字块}>
                  <div style={{ color: "#666", fontSize: "0.75rem" }}>真值 f(x)</div>
                  {格式(真值, 6)}
                </div>
                <div style={数字块}>
                  <div style={{ color: "#666", fontSize: "0.75rem" }}>
                    近似 P{泰勒.有效阶}(x)
                  </div>
                  {格式(近似值, 6)}
                </div>
                <div
                  style={{
                    ...数字块,
                    color: 绝对误差 < 1e-3 ? "#15803d" : "#b45309",
                    fontWeight: "bold",
                  }}
                >
                  <div
                    style={{
                      color: "#666",
                      fontSize: "0.75rem",
                      fontWeight: "normal",
                    }}
                  >
                    误差
                  </div>
                  {格式(绝对误差, 4)}
                  {Number.isFinite(相对误差) && (
                    <span style={{ fontSize: "0.8rem" }}>
                      {" "}
                      ({相对误差.toFixed(2)}%)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 容差区间 */}
            {项.显示容差区间 && 区间 && (
              <div
                style={{
                  marginTop: "0.75rem",
                  padding: "0.5rem",
                  background: "#f0f9ff",
                  borderRadius: "4px",
                  fontSize: "0.9rem",
                }}
              >
                {区间.可用 ? (
                  <>
                    误差 ≤ {项.容差} 的区间：
                    <strong style={{ fontFamily: "monospace" }}>
                      {" "}
                      [{格式(区间.左)}, {格式(区间.右)}]
                    </strong>
                    ，宽 {格式(区间.宽度)}
                    {(区间.左到头 || 区间.右到头) && (
                      <span style={{ color: "#666" }}> （扫描范围内未越界，实际更宽）</span>
                    )}
                    {区间.太窄 && (
                      <div style={{ color: "#b45309", marginTop: "0.2rem" }}>
                        区间太窄，图上几乎看不见 —— 试试提高阶数或放宽容差
                      </div>
                    )}
                  </>
                ) : (
                  <span style={{ color: "#b45309" }}>{区间.原因}</span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const 单元格 = {
  border: "1px solid #e5e5e5",
  padding: "0.3rem 0.5rem",
  textAlign: "left",
};

const 公式块 = {
  padding: "0.5rem",
  background: "#f8f8f8",
  borderRadius: "4px",
  fontSize: "0.9rem",
  wordBreak: "break-all",
  lineHeight: 1.6,
};

const 数字块 = {
  padding: "0.4rem",
  background: "#fafafa",
  borderRadius: "4px",
};

export default TaylorReadout;

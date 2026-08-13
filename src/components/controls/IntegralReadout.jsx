// 画布下方的数据条 - 黎曼和公式、当前值、真实答案、误差
import { 解析表达式 } from "../../math/parse";
import { 求黎曼和, 求参考值, n序列 } from "../../math/integral";

// 按端点方式给出对应的求和写法（AP 会考三者的区别）
function 取样点写法(端点方式) {
  if (端点方式 === "左") return { 取样: "a + iΔx", 范围: "i = 0 … n−1" };
  if (端点方式 === "中") return { 取样: "a + (i−½)Δx", 范围: "i = 1 … n" };
  return { 取样: "a + iΔx", 范围: "i = 1 … n" };
}

function IntegralReadout({ 函数列表 }) {
  const 开启的 = 函数列表.filter((项) => 项.显示积分 && 项.表达式);
  if (!开启的.length) return null;

  return (
    <div style={{ marginTop: "1rem", display: "grid", gap: "1rem" }}>
      {开启的.map((项) => {
        // 半截表达式可能抛错，包一层
        let 黎曼和 = NaN;
        let 参考值 = NaN;
        try {
          const 解析结果 = 解析表达式(项.表达式);
          if (解析结果 && 解析结果.成功) {
            const n = Number.isFinite(项.当前n) && 项.当前n > 0 ? 项.当前n : 1;
            黎曼和 = 求黎曼和(
              解析结果.计算函数,
              项.积分下限,
              项.积分上限,
              n,
              项.端点方式
            );
            参考值 = 求参考值(解析结果.计算函数, 项.积分下限, 项.积分上限);
          }
        } catch {
          黎曼和 = NaN;
          参考值 = NaN;
        }

        const n = Number.isFinite(项.当前n) && 项.当前n > 0 ? 项.当前n : 1;
        const a = 项.积分下限;
        const b = 项.积分上限;
        const Δx = (b - a) / n;

        const 绝对误差 =
          Number.isFinite(黎曼和) && Number.isFinite(参考值)
            ? Math.abs(黎曼和 - 参考值)
            : NaN;
        const 相对误差 =
          Number.isFinite(绝对误差) && Math.abs(参考值) > 1e-9
            ? (绝对误差 / Math.abs(参考值)) * 100
            : NaN;

        // 走到序列末尾就算逼近完成，答案区高亮
        const 已完成 = !项.积分播放中 && n >= n序列[n序列.length - 1];
        const 写法 = 取样点写法(项.端点方式);

        return (
          <div
            key={项.id}
            style={{
              padding: "1rem 1.25rem",
              border: `2px solid ${项.颜色}`,
              borderRadius: "8px",
              background: "#fff",
            }}
          >
            {/* 标题：这是哪条函数的哪个积分 */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "1.15rem",
                fontWeight: "bold",
                marginBottom: "0.75rem",
              }}
            >
              <span
                style={{
                  width: "1rem",
                  height: "1rem",
                  borderRadius: "50%",
                  backgroundColor: 项.颜色,
                  flexShrink: 0,
                }}
              />
              <span style={{ fontFamily: "monospace" }}>
                ∫ 从 {a} 到 {b} 　{项.表达式} dx
              </span>
            </div>

            {/* 黎曼和的数学写法 */}
            <div
              style={{
                fontFamily: "monospace",
                fontSize: "1.05rem",
                lineHeight: 2,
                padding: "0.75rem",
                background: "#f8f8f8",
                borderRadius: "6px",
              }}
            >
              <div>
                Σ f({写法.取样}) · Δx 　　（{写法.范围}，{项.端点方式}端点）
              </div>
              <div style={{ color: "#555" }}>
                Δx = (b − a) / n = ({b} − {a}) / {n} ={" "}
                {Number.isFinite(Δx) ? Δx.toFixed(5) : "—"}
              </div>
              <div style={{ fontWeight: "bold", fontSize: "1.2rem" }}>
                n = {n} 　→ 　黎曼和 ={" "}
                {Number.isFinite(黎曼和) ? 黎曼和.toFixed(5) : "无法计算"}
              </div>
            </div>

            {/* 答案与误差 */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "1.5rem",
                marginTop: "0.75rem",
                fontFamily: "monospace",
                fontSize: "1.15rem",
              }}
            >
              <div
                style={{
                  fontWeight: "bold",
                  color: "#1e40af",
                  padding: "0.35rem 0.75rem",
                  borderRadius: "6px",
                  background: 已完成 ? "#dbeafe" : "transparent",
                }}
              >
                答案 = {Number.isFinite(参考值) ? 参考值.toFixed(5) : "无法计算"}
              </div>

              <div
                style={{
                  fontWeight: "bold",
                  color:
                    Number.isFinite(相对误差) && 相对误差 < 1
                      ? "#15803d"
                      : "#b45309",
                  padding: "0.35rem 0",
                }}
              >
                误差 = {Number.isFinite(绝对误差) ? 绝对误差.toFixed(5) : "—"}
                {Number.isFinite(相对误差) && `　（${相对误差.toFixed(2)}%）`}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default IntegralReadout;

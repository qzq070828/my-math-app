// 泰勒面板 - 展开点 a、阶数 n（含播放）、误差带、容差区间
//
// 播放的是 n 不是 a：学生要看的是「多项式一阶阶贴上去」，
// 每档停 1.2 秒 —— 太快了眼睛跟不上公式和曲线同时在变。

import { useEffect, useRef } from "react";
import { 最高支持阶 } from "../../math/taylor";

const 每档毫秒 = 1200;

const 容差选项 = [
  { 值: 1e-1, 标签: "10⁻¹" },
  { 值: 1e-2, 标签: "10⁻²" },
  { 值: 1e-3, 标签: "10⁻³" },
  { 值: 1e-5, 标签: "10⁻⁵" },
];

function TaylorPanel({ 函数列表, 更新函数 }) {
  // 播放：每 1.2 秒把 n 加一，到顶自动停
  const 计时器 = useRef(null);

  useEffect(() => {
    const 有人在播 = 函数列表.some((项) => 项.泰勒播放中);

    if (!有人在播) {
      if (计时器.current) {
        clearInterval(计时器.current);
        计时器.current = null;
      }
      return;
    }

    if (计时器.current) return; // 已经在跑，别重复开

    计时器.current = setInterval(() => {
      函数列表.forEach((项) => {
        if (!项.泰勒播放中) return;
        const 当前 = Number.isFinite(项.泰勒阶数) ? 项.泰勒阶数 : 0;
        if (当前 >= 最高支持阶) {
          更新函数(项.id, "泰勒播放中", false);
        } else {
          更新函数(项.id, "泰勒阶数", 当前 + 1);
        }
      });
    }, 每档毫秒);

    return () => {
      if (计时器.current) {
        clearInterval(计时器.current);
        计时器.current = null;
      }
    };
  }, [函数列表, 更新函数]);

  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "1rem",
        background: "#fff",
      }}
    >
      <div
        style={{
          fontWeight: "bold",
          fontSize: "1.15rem",
          marginBottom: "0.75rem",
        }}
      >
        ≈ 泰勒展开
      </div>

      {函数列表.map((项) => {
        const a = Number.isFinite(项.展开点a) ? 项.展开点a : 0;
        const n = Number.isFinite(项.泰勒阶数) ? 项.泰勒阶数 : 1;
        const 播放中 = Boolean(项.泰勒播放中);

        return (
          <div
            key={项.id}
            style={{
              marginBottom: "1rem",
              paddingBottom: "0.75rem",
              borderBottom: "1px solid #f0f0f0",
            }}
          >
            {/* 开关 */}
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                cursor: "pointer",
                fontSize: "0.95rem",
              }}
            >
              <input
                type="checkbox"
                checked={Boolean(项.显示泰勒)}
                onChange={(事件) => {
                  更新函数(项.id, "显示泰勒", 事件.target.checked);
                  if (!事件.target.checked) 更新函数(项.id, "泰勒播放中", false);
                }}
              />
              <span
                style={{
                  width: "0.8rem",
                  height: "0.8rem",
                  borderRadius: "50%",
                  background: 项.颜色,
                  display: "inline-block",
                  flexShrink: 0,
                }}
              />
              <span style={{ fontFamily: "monospace" }}>
                {项.表达式 || "（空）"}
              </span>
            </label>

            {项.显示泰勒 && (
              <div style={{ marginTop: "0.6rem", marginLeft: "1.4rem" }}>
                {/* 展开点 a：滑块 + 数字框 */}
                <div style={{ fontSize: "0.9rem" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                    }}
                  >
                    <span>展开点 a =</span>
                    <input
                      type="number"
                      step="0.1"
                      value={Number(a.toFixed(3))}
                      onChange={(事件) =>
                        更新函数(项.id, "展开点a", Number(事件.target.value))
                      }
                      style={{ width: "5rem", padding: "0.2rem" }}
                    />
                  </div>
                  <input
                    type="range"
                    min="-5"
                    max="5"
                    step="0.01"
                    value={a}
                    onChange={(事件) =>
                      更新函数(项.id, "展开点a", Number(事件.target.value))
                    }
                    style={{ width: "100%", marginTop: "0.3rem" }}
                  />
                </div>

                {/* 阶数 n + 播放 */}
                <div style={{ marginTop: "0.6rem", fontSize: "0.9rem" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span>
                      阶数 n = <strong>{n}</strong>
                    </span>
                    <button
                      onClick={() => {
                        if (播放中) {
                          更新函数(项.id, "泰勒播放中", false);
                        } else {
                          // 已经到顶，从 0 重新开始
                          if (n >= 最高支持阶) 更新函数(项.id, "泰勒阶数", 0);
                          更新函数(项.id, "泰勒播放中", true);
                        }
                      }}
                      style={{
                        padding: "0.2rem 0.6rem",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        background: 播放中 ? "#fee2e2" : "#dbeafe",
                        cursor: "pointer",
                        fontSize: "0.85rem",
                      }}
                    >
                      {播放中 ? "⏸ 暂停" : "▶ 播放"}
                    </button>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={最高支持阶}
                    step="1"
                    value={n}
                    onChange={(事件) => {
                      更新函数(项.id, "泰勒播放中", false); // 手动拖就停播
                      更新函数(项.id, "泰勒阶数", Number(事件.target.value));
                    }}
                    style={{ width: "100%", marginTop: "0.3rem" }}
                  />
                  {n === 0 && (
                    <div style={{ fontSize: "0.8rem", color: "#b45309" }}>
                      零阶是一条水平线 y = f(a)
                    </div>
                  )}
                  {n === 1 && (
                    <div style={{ fontSize: "0.8rem", color: "#b45309" }}>
                      一阶泰勒就是切线
                    </div>
                  )}
                </div>

                {/* 误差带 */}
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    marginTop: "0.6rem",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={Boolean(项.显示误差带)}
                    onChange={(事件) =>
                      更新函数(项.id, "显示误差带", 事件.target.checked)
                    }
                  />
                  显示误差区域（填充色）
                </label>

                {/* 容差区间 */}
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    marginTop: "0.3rem",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={Boolean(项.显示容差区间)}
                    onChange={(事件) =>
                      更新函数(项.id, "显示容差区间", 事件.target.checked)
                    }
                  />
                  显示准确度区间
                </label>

                {项.显示容差区间 && (
                  <div
                    style={{
                      marginTop: "0.3rem",
                      marginLeft: "1.2rem",
                      fontSize: "0.85rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                    }}
                  >
                    <span>误差容限</span>
                    <select
                      value={项.容差}
                      onChange={(事件) =>
                        更新函数(项.id, "容差", Number(事件.target.value))
                      }
                      style={{ padding: "0.2rem" }}
                    >
                      {容差选项.map((选项) => (
                        <option key={选项.值} value={选项.值}>
                          {选项.标签}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default TaylorPanel;

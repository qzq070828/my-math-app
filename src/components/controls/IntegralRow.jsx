// 单个函数的积分控制 - 上下限、端点方式、逼近播放
import { useEffect } from "react";
import { n序列 } from "../../math/integral";

const 每步毫秒 = 400;

function IntegralRow({ 项, 更新函数 }) {
  const 当前n = Number.isFinite(项.当前n) && 项.当前n > 0 ? 项.当前n : 1;

  // n 的逐步逼近：每次只安排下一步，走到序列末尾自动停
  useEffect(() => {
    if (!项.积分播放中) return;

    const 位置 = n序列.indexOf(当前n);
    if (位置 === -1 || 位置 >= n序列.length - 1) {
      更新函数(项.id, "积分播放中", false);
      return;
    }

    const 定时器 = setTimeout(() => {
      更新函数(项.id, "当前n", n序列[位置 + 1]);
    }, 每步毫秒);

    return () => clearTimeout(定时器);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [项.积分播放中, 当前n]);

  function 开始逼近() {
    更新函数(项.id, "当前n", n序列[0]);
    更新函数(项.id, "积分播放中", true);
  }

  return (
    <div
      style={{
        marginBottom: "0.75rem",
        padding: "0.6rem",
        border: "1px solid #ddd",
        borderRadius: "6px",
        background: "#fafafa",
        fontSize: "0.85rem",
      }}
    >
      {/* 用颜色点 + 表达式标明这是哪条函数 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          marginBottom: "0.4rem",
        }}
      >
        <span
          style={{
            width: "0.8rem",
            height: "0.8rem",
            borderRadius: "50%",
            backgroundColor: 项.颜色,
            flexShrink: 0,
          }}
        />
        <span style={{ fontFamily: "monospace" }}>{项.表达式 || "（空）"}</span>
      </div>

      <label
        style={{ display: "flex", alignItems: "center", gap: "0.3rem", cursor: "pointer" }}
      >
        <input
          type="checkbox"
          checked={项.显示积分}
          onChange={(事件) => 更新函数(项.id, "显示积分", 事件.target.checked)}
        />
        定积分（黎曼和逼近）
      </label>

      {项.显示积分 && (
        <div style={{ marginTop: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <span>a =</span>
            <input
              type="number"
              step="0.1"
              value={项.积分下限}
              onChange={(事件) =>
                更新函数(项.id, "积分下限", Number(事件.target.value))
              }
              style={{ width: "4rem", padding: "0.2rem" }}
            />
            <span>b =</span>
            <input
              type="number"
              step="0.1"
              value={项.积分上限}
              onChange={(事件) =>
                更新函数(项.id, "积分上限", Number(事件.target.value))
              }
              style={{ width: "4rem", padding: "0.2rem" }}
            />
          </div>

          {/* 端点方式：AP 会考「左和是高估还是低估」 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
              marginTop: "0.4rem",
            }}
          >
            <span>矩形高取</span>
            <select
              value={项.端点方式}
              onChange={(事件) => 更新函数(项.id, "端点方式", 事件.target.value)}
              style={{ padding: "0.15rem" }}
            >
              <option value="左">左端点</option>
              <option value="右">右端点</option>
              <option value="中">中点</option>
            </select>
          </div>

          <button
            onClick={开始逼近}
            disabled={项.积分播放中}
            style={{
              width: "100%",
              marginTop: "0.5rem",
              padding: "0.4rem",
              border: "1px solid #999",
              borderRadius: "4px",
              background: 项.积分播放中 ? "#eee" : "#fff",
              cursor: 项.积分播放中 ? "default" : "pointer",
            }}
          >
            {项.积分播放中 ? "逼近中…" : "▶ 开始逼近"}
          </button>

          {/* 手动拖 n：拖动时停止自动播放 */}
          <input
            type="range"
            min="0"
            max={n序列.length - 1}
            step="1"
            value={Math.max(0, n序列.indexOf(当前n))}
            onChange={(事件) => {
              更新函数(项.id, "积分播放中", false);
              更新函数(项.id, "当前n", n序列[Number(事件.target.value)]);
            }}
            style={{ width: "100%", marginTop: "0.4rem" }}
          />
        </div>
      )}
    </div>
  );
}

export default IntegralRow;

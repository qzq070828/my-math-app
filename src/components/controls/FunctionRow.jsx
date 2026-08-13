// 功能概括
// 单个函数行 - 颜色块 + 表达式输入框 + 删除按钮 + 导数/切线/追踪控制
import { useState } from "react";
import { 可选颜色 } from "../../utils/colors";
import { 解析表达式 } from "../../math/parse";
import { 求导数值, 找区间内临界点 } from "../../math/derivative";
import { 检查表达式 } from "../../math/validate"

// 停在临界点后，需要要拖出这么远才放开（数学单位）
const 逃逸距离 = 0.35;

function FunctionRow({ 项, 更新函数, 删除函数, 可删除 }) {
  const [调色盘展开, 设置调色盘展开] = useState(false);
  //解析式保护，防止崩溃
  // 解析表达式，可能因为半截输入而抛错，包一层防止整个组件崩掉
  let 解析结果 = null;
  try {
    解析结果 = 项.表达式 ? 解析表达式(项.表达式) : null;
  } catch {
    解析结果 = null;
  }

  const 可用 = Boolean(解析结果 && 解析结果.成功);
  //错误提示功能
  // 错误提示：先给自制错误检查，无法识别后，再给通用纠错
  const 自查错误 = 检查表达式(项.表达式);
  const 错误提示 = 自查错误 || (项.表达式 && !可用 ? "这个算式解析不了，检查一下写法" : null);

  // 切点可能因为清空输入框变成 NaN，兜底成 0
  const 切点 = Number.isFinite(项.切点x) ? 项.切点x : 0;
  const 滑块范围 =
    Number.isFinite(项.滑块范围) && 项.滑块范围 > 0 ? 项.滑块范围 : 5;

  let 当前斜率 = NaN;
  if (可用) {
    try {
      当前斜率 = 求导数值(解析结果.计算函数, 切点);
    } catch {
      当前斜率 = NaN;
    }
  }

  const 是临界点 = Number.isFinite(当前斜率) && Math.abs(当前斜率) < 0.001;
  // 导数关键点粘连停止功能，防止错过关键信息
  // 滑块拖动：先看是否该「粘住」，再看这一步有没有跨过临界点
  function 处理切点变化(新值) {
    if (!Number.isFinite(新值)) return;

    if (!可用) {
      更新函数(项.id, "切点x", 新值);
      return;
    }

    if (是临界点 && Math.abs(新值 - 切点) < 逃逸距离) return;

    let 临界点 = null;
    try {
      临界点 = 找区间内临界点(解析结果.计算函数, 切点, 新值);
    } catch {
      临界点 = null;
    }

    更新函数(项.id, "切点x", 临界点 !== null ? 临界点 : 新值);
  }

  return (
    <div style={{ marginBottom: "0.75rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
        {/* 颜色块：点一下展开调色盘 */}
        <button
          onClick={() => 设置调色盘展开(!调色盘展开)}
          title="选择颜色"
          style={{
            width: "1.75rem",
            height: "1.75rem",
            backgroundColor: 项.颜色,
            border: "2px solid #fff",
            boxShadow: "0 0 0 1px #ccc",
            borderRadius: "50%",
            cursor: "pointer",
            flexShrink: 0,
          }}
        />

        {/* 表达式输入框 */}
        <input
          type="text"
          value={项.表达式}
          onChange={(事件) => 更新函数(项.id, "表达式", 事件.target.value)}
          placeholder="例如: sin(x)"
          style={{
            flex: 1,
            minWidth: 0,
            border: 错误提示 ? "1px solid #dc2626" : "1ppx solid #ccc",
            padding: "0.5rem",
            fontSize: "1rem",
            boxSizing: "border-box",
          }}
        />

        {/* 删除按钮：只剩一个时不显示，避免全删光 */}
        {可删除 && (
          <button
            onClick={() => 删除函数(项.id)}
            title="删除这个函数"
            style={{
              width: "1.75rem",
              height: "1.75rem",
              border: "1px solid #ccc",
              borderRadius: "4px",
              background: "#fff",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            ×
          </button>
        )}
      </div>
      {/*错误提示*/}
      {错误提示 && (
        <div
          style={{
            marginTop: "0.3rem",
            marginLeft: "2.15rem",
            fontSize: "0.8rem",
            color: "#b91c1c",
          }}
        >
          {错误提示}
        </div>
      )}

      {/* 导数开关 */}
      <div
        style={{
          marginTop: "0.4rem",
          marginLeft: "2.15rem",
          fontSize: "0.85rem",
        }}
      >
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.3rem",
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={项.显示导数}
            onChange={(事件) => 更新函数(项.id, "显示导数", 事件.target.checked)}
          />
          显示导数 f′(x)（虚线）
        </label>
      </div>

      {/* 切线开关 + 切点控制 */}
      <div
        style={{
          marginTop: "0.4rem",
          marginLeft: "2.15rem",
          fontSize: "0.85rem",
        }}
      >
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.3rem",
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={项.显示切线}
            onChange={(事件) => 更新函数(项.id, "显示切线", 事件.target.checked)}
          />
          显示切线
        </label>

        {项.显示切线 && (
          <div style={{ marginTop: "0.4rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span>x =</span>
              {/* 手动输入不吸附，保证能精确定位 */}
              <input
                type="number"
                step="0.01"
                value={Number(切点.toFixed(3))}
                onChange={(事件) =>
                  更新函数(项.id, "切点x", Number(事件.target.value))
                }
                style={{ width: "5rem", padding: "0.2rem" }}
              />
            </div>

            {/* step 跟着范围缩放：范围越小，拖动越精细 */}
            <input
              type="range"
              min={-滑块范围}
              max={滑块范围}
              step={滑块范围 / 500}
              value={切点}
              onChange={(事件) => 处理切点变化(Number(事件.target.value))}
              style={{ width: "100%", marginTop: "0.3rem" }}
            />

            {/* 滑块范围可调 */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
                marginTop: "0.2rem",
                fontSize: "0.8rem",
                color: "#666",
              }}
            >
              <span>范围 ±</span>
              <input
                type="number"
                min="0.1"
                step="1"
                value={滑块范围}
                onChange={(事件) => {
                  const 新范围 = Number(事件.target.value);
                  if (新范围 > 0) 更新函数(项.id, "滑块范围", 新范围);
                }}
                style={{ width: "4rem", padding: "0.15rem" }}
              />
            </div>

            {/* 实时导数值 */}
            <div
              style={{
                marginTop: "0.2rem",
                fontFamily: "monospace",
                color: 是临界点 ? "#b45309" : "#444",
                fontWeight: 是临界点 ? "bold" : "normal",
              }}
            >
              {Number.isFinite(当前斜率)
                ? `f′(${切点.toFixed(2)}) = ${当前斜率.toFixed(3)}`
                : `f′(${切点.toFixed(2)}) 无定义`}
              {是临界点 && " ← 临界点"}
            </div>
          </div>
        )}
      </div>

      {/* 动画追踪 */}
      <div
        style={{
          marginTop: "0.4rem",
          marginLeft: "2.15rem",
          fontSize: "0.85rem",
        }}
      >
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.3rem",
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={项.追踪函数}
            onChange={(事件) => 更新函数(项.id, "追踪函数", 事件.target.checked)}
          />
          追踪函数（看曲线怎么长出来）
        </label>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.3rem",
            cursor: "pointer",
            marginTop: "0.25rem",
          }}
        >
          <input
            type="checkbox"
            checked={项.追踪切线}
            onChange={(事件) => 更新函数(项.id, "追踪切线", 事件.target.checked)}
          />
          追踪切线（看斜率怎么变）
        </label>
      </div>

      {/* 调色盘：展开时才渲染 */}
      {调色盘展开 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.4rem",
            marginTop: "0.5rem",
            padding: "0.5rem",
            border: "1px solid #ddd",
            borderRadius: "6px",
            background: "#fafafa",
          }}
        >
          {可选颜色.map((颜色) => (
            <button
              key={颜色}
              onClick={() => {
                更新函数(项.id, "颜色", 颜色);
                设置调色盘展开(false);
              }}
              style={{
                width: "1.5rem",
                height: "1.5rem",
                backgroundColor: 颜色,
                border:
                  颜色 === 项.颜色 ? "2px solid #333" : "2px solid transparent",
                borderRadius: "50%",
                cursor: "pointer",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default FunctionRow;

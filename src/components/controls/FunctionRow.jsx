// 功能概括
// 单个函数行 - 颜色块 + 表达式输入框 + 删除按钮 + 导数/切线/追踪控制
import { useState } from "react";
import { 可选颜色 } from "../../utils/colors";
import { 解析表达式 } from "../../math/parse";
import { 取导数, 找区间内临界点 } from "../../math/derivative";
import { 检查表达式 } from "../../math/validate";
import { useLanguage } from "../../i18n/LanguageContext";
import NumberInput from "./NumberInput";
import Tex from "../common/Tex";

// 停在临界点后，需要要拖出这么远才放开（数学单位）
const 逃逸距离 = 0.35;

function FunctionRow({ 项, 更新函数, 删除函数, 可删除 }) {
  const { t } = useLanguage();
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
  const 错误提示 = 自查错误
    ? t(自查错误.键, ...(自查错误.参数 || []))
    : 项.表达式 && !可用
      ? t("解析不了")
      : null;

  // 切点可能因为清空输入框变成 NaN，兜底成 0
  const 切点 = Number.isFinite(项.切点x) ? 项.切点x : 0;
  const 滑块范围 =
    Number.isFinite(项.滑块范围) && 项.滑块范围 > 0 ? 项.滑块范围 : 5;

  // 符号求导优先：切线斜率和泰勒的一阶系数必须来自同一个来源
  let 导数信息 = { 求值: () => NaN, 是符号: false, 公式: null, 公式Tex: null };
  let 当前斜率 = NaN;
  if (可用) {
    try {
      导数信息 = 取导数(项.表达式, 解析结果.计算函数, 1);
      当前斜率 = 导数信息.求值(切点);
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
      临界点 = 找区间内临界点(导数信息.求值, 切点, 新值);
    } catch {
      临界点 = null;
    }

    更新函数(项.id, "切点x", 临界点 !== null ? 临界点 : 新值);
  }

  return (
    <div className="函数行">
      <div className="行顶">
        {/* 颜色块：点一下展开调色盘 */}
        <button
          className="色钮"
          onClick={() => 设置调色盘展开(!调色盘展开)}
          title={t("选择颜色")}
          style={{ backgroundColor: 项.颜色 }}
        />

        {/* 表达式输入框 */}
        <input
          type="text"
          className={`输入框 表达式框${错误提示 ? " 错误" : ""}`}
          value={项.表达式}
          onChange={(事件) => 更新函数(项.id, "表达式", 事件.target.value)}
          placeholder={t("例如: sin(x)")}
        />

        {/* 删除按钮：只剩一个时不显示，避免全删光 */}
        {可删除 && (
          <button
            className="删钮"
            onClick={() => 删除函数(项.id)}
            title={t("删除这个函数")}
          >
            ×
          </button>
        )}
      </div>

      {/*错误提示*/}
      {错误提示 && <div className="错提">{错误提示}</div>}

      {/* 导数开关 */}
      <div className="子区">
        <label className="复选行">
          <input
            type="checkbox"
            checked={项.显示导数}
            onChange={(事件) => 更新函数(项.id, "显示导数", 事件.target.checked)}
          />
          {t("显示导数")}
        </label>

        {项.显示导数 && (导数信息.公式Tex || 导数信息.公式) && (
          <div className="导数式">
            {导数信息.公式Tex ? (
              <Tex 源码={`f'(x) = ${导数信息.公式Tex}`} />
            ) : (
              <span className="代码">f′(x) = {导数信息.公式}</span>
            )}
          </div>
        )}
      </div>

      {/* 切线开关 + 切点控制 */}
      <div className="子区">
        <label className="复选行">
          <input
            type="checkbox"
            checked={项.显示切线}
            onChange={(事件) => 更新函数(项.id, "显示切线", 事件.target.checked)}
          />
          {t("显示切线")}
        </label>

        {项.显示切线 && (
          <>
            <div className="联排">
              <span className="微标">x =</span>
              {/* 手动输入不吸附，保证能精确定位 */}
              <NumberInput
                step="0.01"
                值={切点}
                提交={(数) => 更新函数(项.id, "切点x", 数)}
                style={{ width: "5rem" }}
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
              style={{ width: "100%" }}
            />

            {/* 滑块范围可调 */}
            <div className="联排 微标">
              <span>{t("范围 ±")}</span>
              <NumberInput
                min="0.1"
                step="1"
                值={滑块范围}
                提交={(数) => {
                  // 范围必须为正，否则滑块 min/max 反转
                  if (数 > 0) 更新函数(项.id, "滑块范围", 数);
                }}
                style={{ width: "4rem" }}
              />
            </div>

            {/* 实时导数值 */}
            <div className={`斜率读数${是临界点 ? " 临界" : ""}`}>
              {Number.isFinite(当前斜率) ? (
                <Tex
                  源码={`f'(${切点.toFixed(2)}) = ${当前斜率.toFixed(3)}`}
                />
              ) : (
                `f′(${切点.toFixed(2)}) ${t("无定义")}`
              )}
              {是临界点 && t("临界点")}
            </div>
          </>
        )}
      </div>

      {/* 动画追踪 */}
      <div className="子区">
        <label className="复选行">
          <input
            type="checkbox"
            checked={项.追踪函数}
            onChange={(事件) => 更新函数(项.id, "追踪函数", 事件.target.checked)}
          />
          {t("追踪函数")}
        </label>

        <label className="复选行">
          <input
            type="checkbox"
            checked={项.追踪切线}
            onChange={(事件) => 更新函数(项.id, "追踪切线", 事件.target.checked)}
          />
          {t("追踪切线")}
        </label>
      </div>

      {/* 调色盘：展开时才渲染 */}
      {调色盘展开 && (
        <div className="调色盘">
          {可选颜色.map((颜色) => (
            <button
              key={颜色}
              className={`调色钮${颜色 === 项.颜色 ? " 选中" : ""}`}
              onClick={() => {
                更新函数(项.id, "颜色", 颜色);
                设置调色盘展开(false);
              }}
              style={{ backgroundColor: 颜色 }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default FunctionRow;

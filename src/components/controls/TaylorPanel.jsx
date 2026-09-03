// 泰勒面板 - 展开点 a、阶数 n（含播放）、误差带、容差区间
//
// 播放的是 n 不是 a：学生要看的是「多项式一阶阶贴上去」，
// 每档停 1.2 秒 —— 太快了眼睛跟不上公式和曲线同时在变。

import { useEffect, useRef } from "react";
import { 最高支持阶 } from "../../math/taylor";
import { 表达式转Tex } from "../../math/tex";
import { useLanguage } from "../../i18n/LanguageContext";
import NumberInput from "./NumberInput";
import Tex from "../common/Tex";

const 每档毫秒 = 1200;

const 容差选项 = [
  { 值: 1e-1, 标签: "10⁻¹" },
  { 值: 1e-2, 标签: "10⁻²" },
  { 值: 1e-3, 标签: "10⁻³" },
  { 值: 1e-5, 标签: "10⁻⁵" },
];

function TaylorPanel({ 函数列表, 更新函数, 显示泰勒数据, 切换泰勒数据 }) {
  const { t } = useLanguage();
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
    <section className="面板">
      <div
        className="静态题"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        <span>{t("≈ 泰勒展开")}</span>
        {/* 泰勒数据的开关挪到这里：数据在画布下方的通宽数据带里展开 */}
        <button className="按钮" onClick={切换泰勒数据}>
          {显示泰勒数据 ? t("收起泰勒数据") : t("展开泰勒数据")}
        </button>
      </div>

      <div className="面板体" style={{ borderTop: "none", paddingTop: 0 }}>
        {函数列表.map((项) => {
          const a = Number.isFinite(项.展开点a) ? 项.展开点a : 0;
          const n = Number.isFinite(项.泰勒阶数) ? 项.泰勒阶数 : 1;
          const 播放中 = Boolean(项.泰勒播放中);
          const 式Tex = 项.表达式 ? 表达式转Tex(项.表达式) : null;

          return (
            <div className="功能卡" key={项.id}>
              {/* 开关 */}
              <label className="复选行" style={{ fontSize: "0.92rem" }}>
                <input
                  type="checkbox"
                  checked={Boolean(项.显示泰勒)}
                  onChange={(事件) => {
                    更新函数(项.id, "显示泰勒", 事件.target.checked);
                    if (!事件.target.checked)
                      更新函数(项.id, "泰勒播放中", false);
                  }}
                />
                <span className="色点" style={{ background: 项.颜色 }} />
                {式Tex ? (
                  <Tex 源码={式Tex} />
                ) : (
                  <span className="代码">{项.表达式 || t("空表达式")}</span>
                )}
              </label>

              {项.显示泰勒 && (
                <div
                  style={{
                    marginTop: "0.6rem",
                    marginLeft: "1.4rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.55rem",
                  }}
                >
                  {/* 展开点 a：滑块 + 数字框（数字框可以打 pi/2、π/2 这种常量） */}
                  <div>
                    <div className="联排">
                      <span className="微标">{t("展开点 a =")}</span>
                      <NumberInput
                        值={a}
                        原文={项.展开点a原文}
                        提交={(数, 原文) => {
                          更新函数(项.id, "展开点a", 数);
                          更新函数(项.id, "展开点a原文", 原文 ?? null);
                        }}
                        style={{ width: "5rem" }}
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
                      style={{ width: "100%", marginTop: "0.25rem" }}
                    />
                  </div>

                  {/* 阶数 n + 播放 */}
                  <div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span>
                        {t("阶数 n =")} <strong>{n}</strong>
                      </span>
                      <button
                        className={`按钮${播放中 ? " 按钮-播放中" : " 按钮-主"}`}
                        onClick={() => {
                          if (播放中) {
                            更新函数(项.id, "泰勒播放中", false);
                          } else {
                            // 已经到顶，从 0 重新开始
                            if (n >= 最高支持阶) 更新函数(项.id, "泰勒阶数", 0);
                            更新函数(项.id, "泰勒播放中", true);
                          }
                        }}
                      >
                        {播放中 ? t("暂停") : t("播放")}
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
                      style={{ width: "100%", marginTop: "0.25rem" }}
                    />
                    {n === 0 && <div className="提示语">{t("零阶提示")}</div>}
                    {n === 1 && <div className="提示语">{t("一阶提示")}</div>}
                  </div>

                  {/* 误差带 */}
                  <label className="复选行">
                    <input
                      type="checkbox"
                      checked={Boolean(项.显示误差带)}
                      onChange={(事件) =>
                        更新函数(项.id, "显示误差带", 事件.target.checked)
                      }
                    />
                    {t("显示误差区域")}
                  </label>

                  {/* 容差区间 */}
                  <label className="复选行">
                    <input
                      type="checkbox"
                      checked={Boolean(项.显示容差区间)}
                      onChange={(事件) =>
                        更新函数(项.id, "显示容差区间", 事件.target.checked)
                      }
                    />
                    {t("显示准确度区间")}
                  </label>

                  {项.显示容差区间 && (
                    <div className="联排" style={{ marginLeft: "1.2rem" }}>
                      <span className="微标">{t("误差容限")}</span>
                      <select
                        className="输入框"
                        value={项.容差}
                        onChange={(事件) =>
                          更新函数(项.id, "容差", Number(事件.target.value))
                        }
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
    </section>
  );
}

export default TaylorPanel;

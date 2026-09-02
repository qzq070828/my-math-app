// 泰勒读数 - 系数表 + 字母式 + 数字式 + 点对比
//
// 系数表把「公式是怎么拼出来的」摊开：每一行是 f⁽ᵏ⁾(a) 除以 k! 得到 aₖ，
// 最后一列是这一项的实际写法。学生对着表能自己把公式拼回去。
//
// 所有数学内容走 <Tex>：taylor.js 吐的是 LaTeX 源码，
// 当字符串直接印会看到一堆 \frac{}{}。
// 样式全部走 ui.css 的类名，只有函数颜色是运行时的值，走 --卡色。

import { 解析表达式 } from "../../math/parse";
import { 取泰勒 } from "../../math/taylor";
import { 求容差区间 } from "../../math/errorInterval";
import { 数字转Tex, 变量Tex, 表达式转Tex } from "../../math/tex";
import { useLanguage } from "../../i18n/LanguageContext";
import Tex from "../common/Tex";
import NumberInput from "./NumberInput";

// 纯文本数字，给 t() 的参数用（那些地方进不了 KaTeX）
function 格式(值, 位数 = 4) {
  if (!Number.isFinite(值)) return "—";
  if (Math.abs(值 - Math.round(值)) < 1e-10) return String(Math.round(值));
  return String(Number(值.toPrecision(位数)));
}

function TaylorReadout({ 函数列表, 更新函数 }) {
  const { t } = useLanguage();
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
              className="读数卡"
              style={{ "--卡色": 项.颜色, color: "var(--muted)" }}
            >
              {t("算不出来", 项.表达式)}
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

        const 变量 = 变量Tex(a);
        const 式子Tex = 表达式转Tex(项.表达式);

        return (
          <div key={项.id} className="读数卡" style={{ "--卡色": 项.颜色 }}>
            <div className="读数卡头">
              <span className="色点" style={{ background: 项.颜色 }} />
              {式子Tex ? <Tex 源码={式子Tex} /> : 项.表达式}
              <span className="参数">
                {t("展开参数", 格式(a), 泰勒.有效阶)}
              </span>
            </div>

            {/* 系数表 */}
            <table className="系数表">
              <thead>
                <tr>
                  <th>
                    <Tex 源码="k" />
                  </th>
                  <th>
                    <Tex 源码="f^{(k)}(a)" />
                  </th>
                  <th>
                    <Tex 源码="k!" />
                  </th>
                  <th>
                    <Tex 源码="a_k = \dfrac{f^{(k)}(a)}{k!}" />
                  </th>
                  <th>{t("这一项")}</th>
                </tr>
              </thead>
              <tbody>
                {泰勒.系数.map((系数值, k) => {
                  const 为零 =
                    !Number.isFinite(系数值) || Math.abs(系数值) < 1e-12;
                  return (
                    <tr key={k} className={为零 ? "零项" : undefined}>
                      <td className="数">{k}</td>
                      <td className="数">
                        <Tex 源码={数字转Tex(泰勒.导数值[k])} />
                      </td>
                      <td className="数">{泰勒.阶乘表[k]}</td>
                      <td className="数">
                        <Tex 源码={数字转Tex(系数值)} />
                      </td>
                      <td className="数">
                        {为零 ? (
                          t("这项为零")
                        ) : (
                          <Tex
                            源码={
                              数字转Tex(系数值) +
                              (k === 0
                                ? ""
                                : k === 1
                                  ? 变量
                                  : `${变量}^{${k}}`)
                            }
                          />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* 两种公式：字母式看结构，数字式看结果 */}
            <div className="公式带">
              <div className="数字块标">{t("字母式")}</div>
              <Tex 块 源码={`P_{${泰勒.有效阶}}(x) = ${泰勒.字母公式}`} />
            </div>

            <div className="公式带">
              <div className="数字块标">{t("数字式")}</div>
              <Tex 块 源码={`P_{${泰勒.有效阶}}(x) = ${泰勒.数字公式}`} />
            </div>

            {/* 点对比 */}
            <div className="分割线">
              <div className="联排" style={{ marginBottom: "0.5rem" }}>
                <span>{t("在 x =")}</span>
                <NumberInput
                  值={对比x}
                  提交={(数) => 更新函数(项.id, "对比点x", 数)}
                  style={{ width: "5rem", padding: "0.2rem" }}
                />
                <span>{t("处比较")}</span>
              </div>

              <div className="数字格">
                <div className="数字块">
                  <div className="数字块标">{t("真值 f(x)")}</div>
                  <Tex 源码={数字转Tex(真值, 6)} />
                </div>
                <div className="数字块">
                  <div className="数字块标">{t("近似", 泰勒.有效阶)}</div>
                  <Tex 源码={数字转Tex(近似值, 6)} />
                </div>
                <div
                  className={
                    "数字块 " + (绝对误差 < 1e-3 ? "误差好" : "误差大")
                  }
                  style={{ fontWeight: 700 }}
                >
                  <div className="数字块标" style={{ fontWeight: 400 }}>
                    {t("误差")}
                  </div>
                  <Tex 源码={数字转Tex(绝对误差, 4)} />
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
              <div className="容差条">
                {区间.可用 ? (
                  <>
                    {t("容差区间说明", 项.容差)}{" "}
                    <Tex
                      源码={`[${数字转Tex(区间.左)},\\ ${数字转Tex(区间.右)}]`}
                    />
                    {t("宽", 格式(区间.宽度))}
                    {(区间.左到头 || 区间.右到头) && (
                      <span style={{ color: "var(--muted)" }}>
                        {" "}
                        {t("未越界")}
                      </span>
                    )}
                    {区间.太窄 && <div className="提示语">{t("区间太窄")}</div>}
                  </>
                ) : (
                  <span className="提示语">{区间.原因}</span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default TaylorReadout;

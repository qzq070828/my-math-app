// 泰勒展开 - 用多项式在展开点附近近似 f
//
// 系数 a_k = f⁽ᵏ⁾(a) / k!，近似式 Σ a_k (x−a)^k
// P₀ 是一条水平线 y=f(a)，P₁ 就是切线 —— 这两件事要让学生自己看出来。
//
// 导数走 symbolicDerivative 的缓存链：一次算完 f…f⁽¹²⁾，
// 之后拖 a、拖 n 都只是代入求值，不重新求导。
//
// 字母公式 / 数字公式是 LaTeX 源码，交给 <Tex> 组件排版，不再拼纯文本。
// 数字公式里的系数优先用精确式：基（提取允许基的结果）允许时，
// -3.1416 会写成 -π，0.1667·π³ 会写成 π³/6。

import { 求导数链 } from "./symbolicDerivative";
import { 数字转Tex, 精确数字Tex, 变量Tex, 导数记号Tex } from "./tex";

export const 最高支持阶 = 12;

function 阶乘(n) {
  let 积 = 1;
  for (let i = 2; i <= n; i++) 积 *= i;
  return 积;
}

// 数字公式（LaTeX）：0.8415 + 0.5403(x - 1) - 0.4207(x - 1)^{2}
// 基 允许时系数出符号式：-π(x - 1) + \frac{\pi^{3}}{6}(x - 1)^{3}
function 拼数字公式(系数, a, 基 = null) {
  const 变量 = 变量Tex(a, 基);
  let 结果 = "";

  for (let k = 0; k < 系数.length; k++) {
    const 值 = 系数[k];
    if (!Number.isFinite(值) || Math.abs(值) < 1e-12) continue;

    const 绝对 = Math.abs(值);
    const 幂 = k === 0 ? "" : k === 1 ? 变量 : `${变量}^{${k}}`;
    const 数字 =
      绝对 === 1 && k > 0 ? "" : 基 ? 精确数字Tex(绝对, 基) : 数字转Tex(绝对);
    const 项 = 数字 + 幂;

    if (结果 === "") 结果 = (值 < 0 ? "-" : "") + 项;
    else 结果 += (值 < 0 ? " - " : " + ") + 项;
  }

  return 结果 === "" ? "0" : 结果;
}

// 字母公式（LaTeX）：f(a) + f'(a)(x - a) + \frac{f''(a)}{2!}(x - a)^{2} + …
// 这个不看具体数值，只按阶数拼，让学生看见结构
function 拼字母公式(阶) {
  const 项列表 = [];
  for (let k = 0; k <= 阶; k++) {
    const 导 = 导数记号Tex(k);
    if (k === 0) 项列表.push(导);
    else if (k === 1) 项列表.push(`${导}(x - a)`);
    else 项列表.push(`\\frac{${导}}{${k}!}(x - a)^{${k}}`);
  }
  return 项列表.join(" + ");
}

// 主接口
// 返回 {
//   可用, 展开点, 请求阶, 有效阶,
//   导数值[],   ← f⁽ᵏ⁾(a) 原值，给系数表用
//   阶乘表[],
//   系数[],     ← a_k = f⁽ᵏ⁾(a)/k!
//   数字公式, 字母公式,   ← LaTeX 源码，用 <Tex> 渲染
//   求值(x), 求值到阶(x, n),
//   原因
// }
// 基：提取允许基 的结果（{π, e, 根}），决定数字公式里能不能显示符号式
export function 取泰勒(表达式, 计算函数, 展开点, 最高阶, 基 = null) {
  const 空 = {
    可用: false,
    展开点,
    请求阶: 最高阶,
    有效阶: -1,
    导数值: [],
    阶乘表: [],
    系数: [],
    数字公式: null,
    字母公式: null,
    求值: () => NaN,
    求值到阶: () => NaN,
    原因: "表达式不可用",
  };

  if (!Number.isFinite(展开点)) return { ...空, 原因: "展开点不是数字" };

  const 阶 = Math.max(0, Math.min(最高支持阶, Math.floor(最高阶)));
  const 链 = 求导数链(表达式, Math.max(阶, 1));

  const 导数值 = [];
  const 阶乘表 = [];
  const 系数 = [];

  for (let k = 0; k <= 阶; k++) {
    let 值 = NaN;

    if (k === 0) {
      // 零阶就是函数本身，符号链拿不到也能用 计算函数
      值 = 链.可用阶数 >= 0 ? 链.求值[0](展开点) : NaN;
      if (!Number.isFinite(值) && 计算函数) {
        try {
          值 = 计算函数(展开点);
        } catch {
          值 = NaN;
        }
      }
    } else if (链.可用阶数 >= k) {
      值 = 链.求值[k](展开点);
    }

    // 某阶算不出来就停下，低阶项仍然有效，不整个作废
    if (!Number.isFinite(值)) break;

    const 阶乘值 = 阶乘(k);
    导数值.push(值);
    阶乘表.push(阶乘值);
    系数.push(值 / 阶乘值);
  }

  if (系数.length === 0) {
    return { ...空, 原因: 链.原因 || "在展开点处算不出函数值" };
  }

  const 有效阶 = 系数.length - 1;

  // Horner：从高阶往低阶累加，避免大幂次的舍入放大
  const 求值到阶 = (x, n) => {
    const 上限 = Math.max(0, Math.min(有效阶, n));
    let 和 = 0;
    const 差 = x - 展开点;
    for (let k = 上限; k >= 0; k--) 和 = 和 * 差 + 系数[k];
    return 和;
  };

  return {
    可用: true,
    展开点,
    请求阶: 阶,
    有效阶,
    导数值,
    阶乘表,
    系数,
    数字公式: 拼数字公式(系数, 展开点, 基),
    字母公式: 拼字母公式(有效阶),
    求值: (x) => 求值到阶(x, 有效阶),
    求值到阶,
    原因: 有效阶 < 阶 ? `只能算到 ${有效阶} 阶` : null,
  };
}

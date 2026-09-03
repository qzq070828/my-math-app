// 符号求导 - 按链式/乘积法则推出导数「表达式」，而不是拿两点算斜率
//
// 全项目求导数的唯一来源：derivative.js 和 taylor.js 都从这里取，
// 否则两处各算一套，迟早出现「泰勒的一阶系数和切线斜率对不上」。
//
// 为什么一次算完整条链并缓存：求导要遍历表达式树、还要反复化简，很贵；
// 但结果只依赖表达式，不依赖求值点。一次算出 f…f⁽ⁿ⁾ 存起来，
// 之后拖任何滑块都只是代入求值。不缓存的话拖滑块会卡死。
import { parse, derivative, simplify } from "mathjs";

const 默认最高阶 = 12;
const 缓存上限 = 24;
const 缓存 = new Map();

// 必须和 parse.js 的预处理规则一致，否则同一个式子两处含义不同
// （比如 log 在这里是常用对数，在那边是自然对数；
//   π、√、÷、× 这些手打符号两处都要认得）
export function 预处理表达式(原文) {
  let s = String(原文 || "");
  s = s.replace(/π/g, "pi");
  s = s.replace(/√\s*\(/g, "sqrt(");
  s = s.replace(/√\s*(\d+(?:\.\d+)?|[a-zA-Z]+)/g, "sqrt($1)");
  s = s.replace(/÷/g, "/").replace(/×/g, "*").replace(/−/g, "-");
  s = s.replace(/\bln\s*\(/g, "LNTEMP("); // 先保护 ln，避免连锁替换
  s = s.replace(/\blog\s*\(/g, "log10(");
  s = s.replace(/LNTEMP\(/g, "log(");
  s = s.replace(/\|([^|]*)\|/g, "abs($1)");
  return s;
}

// 编译出的函数在几个点上试算一下，确认真能用
// （symbolic 求导偶尔产出编译通过但求值报错的式子）
function 能用吗(编译后) {
  const 试点 = [0.37, -1.29, 2.61];
  for (const x of 试点) {
    try {
      编译后.evaluate({ x });
    } catch {
      return false; // 求值抛错 → 不可用
    }
  }
  // 试点全算出 NaN 也放行：可能只是定义域不含这几个点（比如 sqrt(x-10)），
  // 不能据此判死刑。这里唯一要拦的是「求值直接抛错」。
  return true;
}

// 返回 { 可用阶数, 求值: [f, f', ...], 公式: [字符串], 公式Tex: [LaTeX], 完整, 原因? }
//   可用阶数 = 最高可用的 k（f 本身算第 0 阶）
//   完整 = 是否一路做到了请求的最高阶
export function 求导数链(表达式, 最高阶 = 默认最高阶) {
  const 阶 = Math.max(0, Math.min(默认最高阶, Math.round(最高阶)));
  const 键 = `${表达式}|${阶}`;
  if (缓存.has(键)) return 缓存.get(键);

  const 求值 = [];
  const 公式 = [];
  const 公式Tex = [];
  let 原因 = null;

  try {
    let 节点 = parse(预处理表达式(表达式));

    for (let k = 0; k <= 阶; k++) {
      if (k > 0) {
        节点 = derivative(节点, "x");
        // 化简防表达式膨胀；失败不影响求值，只是式子难看
        try {
          节点 = simplify(节点);
        } catch {
          /* 忽略 */
        }
      }

      const 编译后 = 节点.compile();
      if (!能用吗(编译后)) {
        原因 = `第 ${k} 阶导数算得出但求不了值`;
        break;
      }
      求值.push((x) => {
        try {
          const v = 编译后.evaluate({ x });
          return Number.isFinite(v) ? v : NaN;
        } catch {
          return NaN;
        }
      });
      公式.push(节点.toString());
      // LaTeX 版公式给界面显示用；个别节点类型没有 toTex 就留 null，
      // 调用方退回显示纯文本公式
      let tex = null;
      try {
        tex = 节点.toTex();
      } catch {
        tex = null;
      }
      公式Tex.push(tex);
    }
  } catch (e) {
    const 原 = String((e && e.message) || e);
    原因 = /derivative|not supported|Cannot differentiate/i.test(原)
      ? "这个函数不能符号求导（abs、floor 这类），改用数值近似"
      : "符号求导失败：" + 原;
  }

  const 结果 = {
    可用阶数: 求值.length - 1, // 0 表示只有 f 本身，-1 表示连 f 都没编译成功
    求值,
    公式,
    公式Tex,
    完整: 求值.length === 阶 + 1,
    原因,
  };

  if (缓存.size >= 缓存上限) 缓存.delete(缓存.keys().next().value);
  缓存.set(键, 结果);
  return 结果;
}

// 取第 k 阶导函数；符号法到不了这一阶就返回 null，让调用方退回数值
export function 取导函数(表达式, k) {
  const 链 = 求导数链(表达式, Math.max(k, 1));
  return 链.可用阶数 >= k ? 链.求值[k] : null;
}

// 第 k 阶导数的公式字符串，拿不到返回 null
export function 取导数公式(表达式, k) {
  const 链 = 求导数链(表达式, Math.max(k, 1));
  return 链.可用阶数 >= k ? 链.公式[k] : null;
}

// 第 k 阶导数公式的 LaTeX 版，拿不到返回 null
export function 取导数公式Tex(表达式, k) {
  const 链 = 求导数链(表达式, Math.max(k, 1));
  return 链.可用阶数 >= k ? 链.公式Tex[k] : null;
}

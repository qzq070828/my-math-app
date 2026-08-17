// ===== 符号求导自测，验完删掉 =====
import { 求导数链, 取导函数, 取导数公式 } from "./symbolicDerivative";
import { 求导数值 } from "./derivative";
import { 解析表达式 } from "./parse";

const 容差 = 1e-6;

// 一阶符号导数 vs 一阶数值导数：光滑函数上两者必须一致
function 对比数值(名字, 表达式, 试点) {
  try {
    const 符号f一 = 取导函数(表达式, 1);
    if (!符号f一) {
      console.log(`❌ ${名字}：拿不到符号一阶导`);
      return;
    }
    const 解析 = 解析表达式(表达式);
    if (!解析 || !解析.成功) {
      console.log(`❌ ${名字}：parse.js 解析失败（预处理规则可能不一致）`);
      return;
    }

    const 差列 = 试点.map((x) =>
      Math.abs(符号f一(x) - 求导数值(解析.计算函数, x))
    );
    const 最大差 = Math.max(...差列);
    // 数值差分本身有误差，1e-4 已经算对得上
    console.log(
      `${最大差 < 1e-4 ? "✅" : "❌"} ${名字} 符号 vs 数值`,
      `最大差 ${最大差.toExponential(2)}`,
      `f'(x) = ${取导数公式(表达式, 1)}`
    );
  } catch (e) {
    console.log(`❌ ${名字} 崩了:`, e);
  }
}

// 指定阶数在指定点的精确值
function 查一阶(名字, 表达式, k, x, 期望) {
  try {
    const f = 取导函数(表达式, k);
    if (!f) {
      console.log(`❌ ${名字}：拿不到第 ${k} 阶`);
      return;
    }
    const 得 = f(x);
    console.log(
      `${Math.abs(得 - 期望) < 容差 ? "✅" : "❌"} ${名字}`,
      `得到 ${得}，期望 ${期望}`
    );
  } catch (e) {
    console.log(`❌ ${名字} 崩了:`, e);
  }
}

console.log("=== 符号求导自测 ===");

对比数值("sin(x)", "sin(x)", [-2, -0.5, 0.3, 1.7, 3.1]);
对比数值("x^3-2x", "x^3-2*x", [-2, -0.5, 0.3, 1.7]);
对比数值("e^x", "e^x", [-1, 0, 1, 2]);
对比数值("ln(x)", "ln(x)", [0.5, 1, 2, 5]);
对比数值("1/(x-2)", "1/(x-2)", [-1, 0, 1, 3, 5]);
对比数值("sqrt(x)", "sqrt(x)", [0.5, 1, 4]);

查一阶("sin 的 4 阶在 0", "sin(x)", 4, 0, 0);
查一阶("sin 的 5 阶在 0", "sin(x)", 5, 0, 1); // 数值法到这阶已是垃圾
查一阶("cos 的 2 阶在 0", "cos(x)", 2, 0, -1);
查一阶("x^5 的 3 阶在 2", "x^5", 3, 2, 240); // 60x² → 240

// ln 的预处理必须和 parse.js 一致：错了会当成 log10，导数差 ln10 倍
查一阶("ln(x) 一阶在 2（验 ln 规则）", "ln(x)", 1, 2, 0.5);
查一阶("log(x) 一阶在 10（验 log10 规则）", "log(x)", 1, 10, 1 / (10 * Math.LN10));

// 12 阶：不能崩，不能太慢
(() => {
  const 开始 = performance.now();
  const 链 = 求导数链("sin(x)*e^x", 12);
  const 耗时 = performance.now() - 开始;
  console.log(
    `${链.完整 && 耗时 < 3000 ? "✅" : "❌"} 12 阶 sin(x)*e^x`,
    `可用到 ${链.可用阶数} 阶，耗时 ${耗时.toFixed(0)}ms`,
    链.原因 || ""
  );
})();

// 缓存：第二次必须快得多
(() => {
  求导数链("cos(x)^2", 10);
  const 开始 = performance.now();
  求导数链("cos(x)^2", 10);
  const 耗时 = performance.now() - 开始;
  console.log(`${耗时 < 2 ? "✅" : "❌"} 缓存命中`, `第二次 ${耗时.toFixed(2)}ms`);
})();

// abs 该优雅降级，不该崩
(() => {
  const 链 = 求导数链("abs(x)", 3);
  console.log(
    `✅ abs(x) 可用到 ${链.可用阶数} 阶`,
    链.原因 || "（居然全阶可导）"
  );
})();

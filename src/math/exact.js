// 精确值识别 - 把算出来的浮点数认回教科书里的符号写法
//
// 学生输入 sin(πx)、展开点打 π/2 之后，系数表里躺着 -3.1416 这种数字，
// 得认出它就是 -π。这里做的是「浮点 → 符号」的逆向识别：
//   π 类：v = (p/q)·π^k，k = 1..3        → -π、2π/3、π²/6
//   e 类：v = (p/q)·e^k，k = 1..3        → e、e/2、e³
//   根号类：v = (p/q)·√n（n 无平方因子）  → √2/2、2√3
//
// 把关是两道的：连分数先给出候选 p/q（分母 ≤ 24），
// 再用误差复核（相对 1e-9）拍板。两道都过才显示符号，
// 所以手打的 3.14159、滑块拖出来的 1.57 都不会被误认 ——
// 认不出来就照常显示小数，显示错了比不显示更糟。

// 连分数最佳有理逼近：返回 { p, q }，q ≤ 最大分母；x 本身不是「干净」
// 有理数时给出的是最接近的渐近分数，靠后面的误差复核兜底
function 有理逼近(数值, 最大分母 = 24) {
  if (!Number.isFinite(数值)) return null;
  const 符号 = 数值 < 0 ? -1 : 1;
  let x = Math.abs(数值);
  if (x < 1e-15) return { p: 0, q: 1 };

  let h2 = 0,
    h1 = 1;
  let k2 = 1,
    k1 = 0;
  let 最佳 = null;
  for (let i = 0; i < 40; i++) {
    const a = Math.floor(x + 1e-12);
    const h = a * h1 + h2;
    const k = a * k1 + k2;
    if (k > 最大分母) break;
    最佳 = { p: h, q: k };
    h2 = h1;
    h1 = h;
    k2 = k1;
    k1 = k;
    const 余 = x - a;
    if (余 < 1e-12) break;
    x = 1 / 余;
  }
  return 最佳 ? { p: 符号 * 最佳.p, q: 最佳.q } : null;
}

// 误差复核：候选重建值和原值贴到这个程度才算「认出」
function 吻合(原值, 重建值) {
  return Math.abs(原值 - 重建值) <= 1e-9 * Math.max(1, Math.abs(原值));
}

// p/q · 基 的 LaTeX 写法：π、2π、-π、π/2、2π/3、-π²/6
function 倍数Tex(p, q, 基Tex) {
  if (p === 0) return "0";
  const 号 = p < 0 ? "-" : "";
  const 绝 = Math.abs(p);
  if (q === 1) return 号 + (绝 === 1 ? 基Tex : `${绝} ${基Tex}`);
  const 分子 = 绝 === 1 ? 基Tex : `${绝} ${基Tex}`;
  return `${号}\\frac{${分子}}{${q}}`;
}

// v ≈ (p/q)·基^k？k 从 1 试到最高幂（π³ 出现在 sin(πx) 的三阶系数里）
function 识别幂倍数(v, 基, 基Tex, 最高幂, 最大分子) {
  for (let k = 1; k <= 最高幂; k++) {
    const 基幂 = Math.pow(基, k);
    const 比 = 有理逼近(v / 基幂);
    if (!比 || Math.abs(比.p) > 最大分子) continue;
    if (!吻合(v, (比.p / 比.q) * 基幂)) continue;
    return 倍数Tex(比.p, 比.q, k === 1 ? 基Tex : `${基Tex}^{${k}}`);
  }
  return null;
}

// v ≈ (p/q)·√n？n 只试无平方因子的（√8 = 2√2，会被 n=2、p=2 覆盖）
function 识别根倍数(v, 最大分子 = 48) {
  for (let n = 2; n <= 48; n++) {
    if (n % 4 === 0 || n % 9 === 0 || n % 25 === 0) continue;
    const 根 = Math.sqrt(n);
    const 比 = 有理逼近(v / 根);
    if (!比 || Math.abs(比.p) > 最大分子) continue;
    if (!吻合(v, (比.p / 比.q) * 根)) continue;
    return 倍数Tex(比.p, 比.q, `\\sqrt{${n}}`);
  }
  return null;
}

// 从用户输入的原文里提取「允许出现哪些符号」。
// 这是总开关：没输入过 π 的函数，算出 1.5708 就还是 1.5708，
// 不会凭空变成 π/2 —— 符号显示是用户「输入过它」才换来的。
// 键盘插入的 pi、sqrt( 是 ASCII，这里一样认。
export function 提取允许基(...文本们) {
  const 文 = 文本们.filter(Boolean).join(" ");
  return {
    π: /π/.test(文) || /(^|[^a-zA-Z])pi(?![a-zA-Z])/.test(文),
    e: /(^|[^a-zA-Z])e(?![a-zA-Z])/.test(文), // 独立的 e 才算，sec/exp 里的不算
    根: /√/.test(文) || /(^|[^a-zA-Z])sqrt(?=\s*\()/.test(文),
  };
}

// 主入口：v 在允许的基下能写成简单符号式 → 返回 LaTeX；认不出 → null。
// 调用方拿到 null 就退回原来的小数显示。
export function 精确Tex(v, 基) {
  if (!Number.isFinite(v) || !基) return null;
  if (基.π) {
    const t = 识别幂倍数(v, Math.PI, "\\pi", 3, 48);
    if (t) return t;
  }
  if (基.e) {
    const t = 识别幂倍数(v, Math.E, "e", 3, 12); // e³ 出现在 e^(3x) 的系数里
    if (t) return t;
  }
  if (基.根) {
    const t = 识别根倍数(v);
    if (t) return t;
  }
  return null;
}

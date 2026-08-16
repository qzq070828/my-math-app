// ===== 采样器 批次二 自测 v2：分类 + 笔画 =====
import { 骨架采样 } from "./skeleton";
import { 造求值器, 精化 } from "./refine";
import { 分类特征 } from "./classify";
import { 生成笔画 } from "./strokes";

const 画布宽 = 1400;
const 画布高 = 800;
const 预算 = 画布宽 * 8;

function 采样(f, x范围, y范围) {
  const [x0, x1] = x范围;
  const [y0, y1] = y范围;
  const y转像素 = (y) => 画布高 - ((y - y0) / (y1 - y0)) * 画布高;
  const 环境 = { y转像素, 每单位像素x: 画布宽 / (x1 - x0), 画布高 };
  const 器 = 造求值器(f, 预算);
  const 出 = 精化(骨架采样(器.求值, x0, x1, 画布宽), 器, 环境);
  const { 逐点, 带段 } = 分类特征(出.特征, 出.未精化, f, 环境);
  const { 笔画, 包络带 } = 生成笔画(出.已解决, 逐点, 带段, 出.空区间, f, 环境);
  return { 笔画, 包络带, 环境, 统计: 出.统计, x0, x1 };
}

// —— 检查工具 ——

// 沿 x 抽 200 个探针，看有多少个被笔画或包络带覆盖
function 覆盖率(r) {
  const N = 200;
  let 中 = 0;
  for (let i = 0; i < N; i++) {
    const x = r.x0 + ((i + 0.5) / N) * (r.x1 - r.x0);
    const 有带 = r.包络带.some((b) => b.左x <= x && x <= b.右x);
    const 有线 =
      !有带 &&
      r.笔画.some((s) => s.length && s[0].x <= x && x <= s[s.length - 1].x);
    if (有带 || 有线) 中++;
  }
  return 中 / N;
}

function 满高占比(r) {
  let 全 = 0;
  let 满 = 0;
  for (const b of r.包络带) {
    const w = b.右x - b.左x;
    全 += w;
    if (b.满高) 满 += w;
  }
  return 全 > 0 ? 满 / 全 : 0;
}

function py范围(s, 环) {
  let 小 = Infinity;
  let 大 = -Infinity;
  for (const p of s) {
    const py = 环.y转像素(p.y);
    if (py < 小) 小 = py;
    if (py > 大) 大 = py;
  }
  return [小, 大];
}

const 贯穿 = (s, 环) => {
  const [小, 大] = py范围(s, 环);
  return 小 < 0 && 大 > 环.画布高;
};

const 出界 = (s, 环) => {
  const [小, 大] = py范围(s, 环);
  return 小 < 0 || 大 > 环.画布高;
};

const y跨度 = (s) => {
  let 小 = Infinity;
  let 大 = -Infinity;
  for (const p of s) {
    if (p.y < 小) 小 = p.y;
    if (p.y > 大) 大 = p.y;
  }
  return 大 - 小;
};

function 跑(名字, f, x范围, y范围, 检查) {
  try {
    const r = 采样(f, x范围, y范围);
    const 摘要 = {
      笔画: r.笔画.length,
      带: r.包络带.length,
      满高带: r.包络带.filter((b) => b.满高).length,
      覆盖: Math.round(覆盖率(r) * 100) + "%",
      求值: r.统计.求值次数,
    };
    const 问题 = 检查(r, 摘要);
    console.log(`${问题 ? "❌" : "✅"} ${名字}`, 摘要, 问题 || "");
  } catch (e) {
    console.log(`❌ ${名字} 崩了:`, e);
  }
}

console.log("=== 采样器批次二自测 v2（笔画 + 包络带）===");

跑("sin(x)", Math.sin, [-9, 9], [-6, 6], (r, s) =>
  s.笔画 !== 1
    ? `该是 1 条笔画，得到 ${s.笔画}`
    : s.带 !== 0
    ? "不该有带"
    : null
);

跑("1000x 陡直线", (x) => 1000 * x, [-9, 9], [-6, 6], (r, s) =>
  s.笔画 !== 1
    ? `该是 1 条笔画，得到 ${s.笔画}`
    : !出界(r.笔画[0], r.环境)
    ? "陡直线该冲出画布上下缘"
    : null
);

跑("1/(x-2) 单极点", (x) => 1 / (x - 2), [-50, 50], [-30, 30], (r, s) =>
  s.笔画 !== 2
    ? `该是 2 条笔画，得到 ${s.笔画}`
    : !r.笔画.every((k) => 出界(k, r.环境))
    ? "每支都该穿出画布边缘"
    : null
);

跑("tan(x) 常规视野", Math.tan, [-12, 12], [-8, 8], (r, s) => {
  if (s.笔画 < 8 || s.笔画 > 11) return `该是 9 支左右，得到 ${s.笔画}`;
  const 全高数 = r.笔画.filter((k) => 贯穿(k, r.环境)).length;
  return 全高数 < 7 ? `贯穿画布的支太少（${全高数}）` : null;
});

跑("tan(x) 极远视野", Math.tan, [-1e5, 1e5], [-5000, 5000], (r) => {
  const 盖 = 覆盖率(r);
  if (盖 < 0.85) return `覆盖率太低（${Math.round(盖 * 100)}%）`;
  const 满 = 满高占比(r);
  return 满 < 0.6
    ? `满高带占比太低（${Math.round(满 * 100)}%），tan 密集区该整段满高`
    : null;
});

跑("sin(20x) 放大", (x) => Math.sin(20 * x), [0, 3], [-2, 2], (r, s) =>
  s.笔画 !== 1
    ? `该是 1 条光滑笔画，得到 ${s.笔画}`
    : s.带 !== 0
    ? "不该有带"
    : null
);

跑("sin(20x) 缩小", (x) => Math.sin(20 * x), [-100, 100], [-120, 120], (r, s) => {
  const 盖 = 覆盖率(r);
  if (盖 < 0.95) return `覆盖率太低（${Math.round(盖 * 100)}%）`;
  if (s.带 < 1) return "该有包络带";
  return r.包络带.some((b) => b.满高) ? "有界震荡不该出满高带" : null;
});

跑("floor(x) 跳跃", Math.floor, [-10, 10], [-12, 12], (r, s) => {
  if (s.笔画 < 19 || s.笔画 > 21) return `该是 20 级台阶左右，得到 ${s.笔画}`;
  if (s.带 !== 0) return "不该有带";
  const 最斜 = Math.max(...r.笔画.map(y跨度));
  return 最斜 > 0.01
    ? `有台阶不平（y 跨度 ${最斜.toFixed(4)}），跳跃被连上了`
    : null;
});

跑("sqrt(x) 定义域边界", Math.sqrt, [-10, 10], [-6, 6], (r, s) =>
  s.笔画 !== 1
    ? `该是 1 条笔画，得到 ${s.笔画}`
    : Math.abs(r.笔画[0][0].x) > 0.02
    ? `起点该贴着 0，得到 ${r.笔画[0][0].x}`
    : null
);

跑("sin(1/x) 振荡", (x) => Math.sin(1 / x), [-2, 2], [-2, 2], (r, s) =>
  s.带 < 1
    ? "0 附近该有包络带"
    : s.笔画 < 2
    ? "两侧的外臂该是笔画"
    : null
);

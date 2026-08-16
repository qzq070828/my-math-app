// 画曲线 - 纯渲染，零决策
//
// 所有数学判断都在 src/math/sampler/ 里做完了，这里只有两件事：
//   笔画[] → 折线
//   包络带[] → 纵向填充
// 之前所有反复的根源都是渲染层里藏着判断，这层从此没有资格出错。
import { 数学转像素 } from "../../utils/mathToScreen";
import { 采样曲线 } from "../../math/sampler";

const 近轴距离 = 3; // 离轴多少像素内算「贴着」
const 平坦跨度 = 6; // 段跨度小于这个才算「沿着轴走」，排除穿过轴的情况

export function 画曲线(
  ctx,
  点数组,
  画布宽,
  画布高,
  视图范围,
  颜色 = "#2563eb",
  计算函数 = null
) {
  // 没给函数就退回老办法：直接连采样点
  if (!计算函数 || !点数组 || !点数组.length) {
    ctx.strokeStyle = 颜色;
    ctx.lineWidth = 2;
    ctx.beginPath();
    let 上一个有效 = false;
    for (const 点 of 点数组 || []) {
      if (!Number.isFinite(点.y)) {
        上一个有效 = false;
        continue;
      }
      const 像素 = 数学转像素(点.x, 点.y, 画布宽, 画布高, 视图范围);
      if (上一个有效) ctx.lineTo(像素.像素x, 像素.像素y);
      else ctx.moveTo(像素.像素x, 像素.像素y);
      上一个有效 = true;
    }
    ctx.stroke();
    return;
  }

  // 画哪一段 x：从点数组首尾取，这样「追踪函数」传部分点时也对
  const 起点x = 点数组[0].x;
  const 终点x = 点数组[点数组.length - 1].x;
  if (!(终点x > 起点x)) return;

  const { 笔画, 包络带 } = 采样曲线(
    计算函数,
    起点x,
    终点x,
    视图范围,
    画布宽,
    画布高
  );

  const x转 = (x) => 数学转像素(x, 0, 画布宽, 画布高, 视图范围).像素x;
  const y转 = (y) => 数学转像素(起点x, y, 画布宽, 画布高, 视图范围).像素y;
  const 夹 = (py) => Math.max(-8, Math.min(画布高 + 8, py));

  // —— 包络带：纵向填充 ——
  if (包络带.length) {
    ctx.save();
    ctx.fillStyle = 颜色;
    for (const 带 of 包络带) {
      const 左px = x转(带.左x);
      const 宽 = Math.max(1, x转(带.右x) - 左px);
      let 顶;
      let 底;
      if (带.满高) {
        顶 = -2;
        底 = 画布高 + 2;
      } else {
        顶 = 夹(y转(带.最大));
        底 = 夹(y转(带.最小));
        if (底 - 顶 < 2) {
          const 中 = (顶 + 底) / 2; // 太薄的带补到 2 像素，别画没
          顶 = 中 - 1;
          底 = 中 + 1;
        }
      }
      ctx.fillRect(左px, 顶, 宽, 底 - 顶);
    }
    ctx.restore();
  }

  if (!笔画.length) return;

  // —— 笔画：先算像素坐标 ——
  const 像素笔画 = 笔画.map((条) =>
    条.map((p) => ({ px: x转(p.x), py: 夹(y转(p.y)) }))
  );

  // —— 贴轴的段垫白边：曲线和坐标轴挤在同一批像素时能分开 ——
  // 「跨度小」把「穿过轴」排除掉：sin(x) 过零点时是斜的，跨度大
  const x轴py = y转(0);
  const y轴px = x转(0);
  let 有贴轴 = false;

  ctx.save();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.beginPath();
  for (const 条 of 像素笔画) {
    for (let i = 1; i < 条.length; i++) {
      const a = 条[i - 1];
      const b = 条[i];
      const 跨 = Math.abs(b.py - a.py);
      const 贴x轴 =
        跨 < 平坦跨度 &&
        Math.min(Math.abs(a.py - x轴py), Math.abs(b.py - x轴py)) < 近轴距离;
      const 贴y轴 =
        跨 >= 平坦跨度 &&
        Math.min(Math.abs(a.px - y轴px), Math.abs(b.px - y轴px)) < 近轴距离;
      if (贴x轴 || 贴y轴) {
        有贴轴 = true;
        ctx.moveTo(a.px, a.py);
        ctx.lineTo(b.px, b.py);
      }
    }
  }
  if (有贴轴) ctx.stroke();
  ctx.restore();

  // —— 正式描线 ——
  ctx.strokeStyle = 颜色;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (const 条 of 像素笔画) {
    ctx.moveTo(条[0].px, 条[0].py);
    for (let i = 1; i < 条.length; i++) ctx.lineTo(条[i].px, 条[i].py);
  }
  ctx.stroke();
}

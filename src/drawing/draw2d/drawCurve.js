// 画曲线 - 把一串数学点连成曲线画在画布上
//
// 三层管线的第二、三层：
//   细分判据 = 中点偏离弦多远（不是两端差多少 ——
//   后者看不见完全藏在两点之间的特征）
//   细到亚像素还在跳 → 交给 analysis.js 极限分类，决定断不断
import { 数学转像素 } from "../../utils/mathToScreen";
import { 可以连接 } from "../../math/analysis";

const 弯曲门槛 = 2; // 中点偏离弦超过这么多像素就细分
const 平滑门槛 = 10; // 两端 y 差在这以内且中点贴弦，直接连
const 最大深度 = 16; // 递归上限，防止在真断点处无限细分
const 最小像素宽 = 0.25; // x 方向细到亚像素就没必要再分

function 细分(计算函数, 点A, 点B, 深度, 结果, 环境) {
  const { 画布宽, 画布高, 视图范围 } = 环境;

  const 像素A = 数学转像素(点A.x, 点A.y, 画布宽, 画布高, 视图范围);
  const 像素B = 数学转像素(点B.x, 点B.y, 画布宽, 画布高, 视图范围);

  // 两端都在画布外的同一侧：中间那段看不见，细分和分析都是浪费
  // 这也是 tan 靠近渐近线时递归的终点
  if (
    (像素A.像素y < 0 && 像素B.像素y < 0) ||
    (像素A.像素y > 画布高 && 像素B.像素y > 画布高)
  ) {
    结果.push({ x: 点B.x, y: 点B.y, 连: true });
    return;
  }

  const 像素宽 = Math.abs(像素B.像素x - 像素A.像素x);

  // 触底：细到亚像素还在跳，才动用极限分类问「这是不是真断点」
  if (深度 >= 最大深度 || 像素宽 < 最小像素宽) {
    const 像素差 = Math.abs(像素B.像素y - 像素A.像素y);
    结果.push({
      x: 点B.x,
      y: 点B.y,
      连:
        像素差 <= 平滑门槛
          ? true
          : 可以连接(点A, 点B, 像素差, 画布高, 计算函数),
    });
    return;
  }

  const 中x = (点A.x + 点B.x) / 2;
  let 中y;
  try {
    中y = 计算函数(中x);
  } catch {
    中y = NaN;
  }

  // 中间无定义：断在这里
  if (!Number.isFinite(中y)) {
    结果.push({ x: 点B.x, y: 点B.y, 连: false });
    return;
  }

  const 像素中 = 数学转像素(中x, 中y, 画布宽, 画布高, 视图范围);

  // 关键判据：中点离「A→B 直线」有多远
  // 直线段偏离为 0（不分），藏了弯的段偏离大（分）
  const 弦上y = (像素A.像素y + 像素B.像素y) / 2;
  const 偏离 = Math.abs(像素中.像素y - 弦上y);

  if (偏离 <= 弯曲门槛 && Math.abs(像素B.像素y - 像素A.像素y) <= 平滑门槛) {
    结果.push({ x: 点B.x, y: 点B.y, 连: true });
    return;
  }

  const 中点 = { x: 中x, y: 中y };
  细分(计算函数, 点A, 中点, 深度 + 1, 结果, 环境);
  细分(计算函数, 中点, 点B, 深度 + 1, 结果, 环境);
}

export function 画曲线(
  ctx,
  点数组,
  画布宽,
  画布高,
  视图范围,
  颜色 = "#2563eb",
  计算函数 = null
) {
  ctx.strokeStyle = 颜色;
  ctx.lineWidth = 2;
  ctx.beginPath();

  const 环境 = { 画布宽, 画布高, 视图范围 };

  // 先算出「画哪些点、哪里断笔」，再统一画
  const 结果 = [];
  let 上一个有效点 = null;

  for (const 点 of 点数组) {
    if (!Number.isFinite(点.y)) {
      上一个有效点 = null; // 断了，下一个有效点重新起笔
      continue;
    }

    if (!上一个有效点) {
      结果.push({ x: 点.x, y: 点.y, 连: false });
    } else if (计算函数) {
      细分(计算函数, 上一个有效点, 点, 0, 结果, 环境);
    } else {
      // 没给函数就补不了点，退回粗略判断
      const 像素A = 数学转像素(
        上一个有效点.x,
        上一个有效点.y,
        画布宽,
        画布高,
        视图范围
      );
      const 像素B = 数学转像素(点.x, 点.y, 画布宽, 画布高, 视图范围);
      结果.push({
        x: 点.x,
        y: 点.y,
        连: Math.abs(像素B.像素y - 像素A.像素y) <= 画布高,
      });
    }

    上一个有效点 = 点;
  }

  for (const 项 of 结果) {
    const 像素 = 数学转像素(项.x, 项.y, 画布宽, 画布高, 视图范围);
    if (项.连) ctx.lineTo(像素.像素x, 像素.像素y);
    else ctx.moveTo(像素.像素x, 像素.像素y);
  }

  ctx.stroke();
}

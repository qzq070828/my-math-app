// 曲线标签 - 在曲线右端标出它是哪个函数
import { 数学转像素 } from "../../utils/mathToScreen";

export function 画函数标签(
  ctx,
  点数组,
  表达式,
  画布宽,
  画布高,
  视图范围,
  颜色
) {
  // 从右往左找第一个「在视野内」的点：曲线可能已经跑出上下边界
  let 目标 = null;
  for (let i = 点数组.length - 1; i >= 0; i--) {
    const 点 = 点数组[i];
    if (!Number.isFinite(点.y)) continue;
    if (点.y < 视图范围.y最小 || 点.y > 视图范围.y最大) continue;
    目标 = 点;
    break;
  }
  if (!目标) return;

  const 像素 = 数学转像素(目标.x, 目标.y, 画布宽, 画布高, 视图范围);

  ctx.save();
  ctx.font = "bold 13px monospace";
  const 文字宽 = ctx.measureText(表达式).width;

  // 贴右边就往左让，免得被裁掉
  let 文字x = 像素.像素x - 文字宽 - 8;
  if (文字x < 4) 文字x = 4;

  // 白底衬一下，压在网格线上也能读
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillRect(文字x - 3, 像素.像素y - 18, 文字宽 + 6, 17);

  ctx.fillStyle = 颜色;
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  ctx.fillText(表达式, 文字x, 像素.像素y - 3);
  ctx.restore();
}

// 画一个标记点 - 用于动画中的移动光标
import { 数学转像素 } from "../../utils/mathToScreen";

export function 画点(ctx, 数学x, 数学y, 画布宽, 画布高, 视图范围, 颜色) {
  if (!Number.isFinite(数学x) || !Number.isFinite(数学y)) return;

  const 点 = 数学转像素(数学x, 数学y, 画布宽, 画布高, 视图范围);

  ctx.fillStyle = 颜色;
  ctx.beginPath();
  ctx.arc(点.像素x, 点.像素y, 6, 0, Math.PI * 2);
  ctx.fill();

  // 白边，保证在曲线和网格上都看得清
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.stroke();
}

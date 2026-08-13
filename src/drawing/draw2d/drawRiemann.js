// 画黎曼矩形 - 把每个小矩形画在曲线下方
import { 数学转像素 } from "../../utils/mathToScreen";

// 矩形太多时边框会糊成一片，超过这个数就不画边框
const 画边框上限 = 60;

export function 画黎曼矩形(ctx, 矩形列表, 画布宽, 画布高, 视图范围, 颜色) {
  if (!矩形列表.length) return;

  ctx.save();

  矩形列表.forEach((矩) => {
    // 顶在函数值处，底永远在 y=0（x 轴）
    const 顶 = 数学转像素(矩.左x, 矩.高, 画布宽, 画布高, 视图范围);
    const 底 = 数学转像素(矩.右x, 0, 画布宽, 画布高, 视图范围);

    const 像素宽 = 底.像素x - 顶.像素x;
    const 像素高 = 底.像素y - 顶.像素y; // 函数值为负时这里是负数，fillRect 能处理

    ctx.globalAlpha = 0.3;
    ctx.fillStyle = 颜色;
    ctx.fillRect(顶.像素x, 顶.像素y, 像素宽, 像素高);

    if (矩形列表.length <= 画边框上限) {
      ctx.globalAlpha = 0.9;
      ctx.strokeStyle = 颜色;
      ctx.lineWidth = 1;
      ctx.strokeRect(顶.像素x, 顶.像素y, 像素宽, 像素高);
    }
  });

  ctx.restore();
}

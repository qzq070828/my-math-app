// 画网格 - 在画布上画出淡灰色的背景网格线
import { 数学转像素 } from "../../utils/mathToScreen";
import { 计算刻度间隔 } from "../../utils/niceNumber";

export function 画网格(ctx, 画布宽, 画布高, 视图范围) {
  ctx.strokeStyle = "#e0e0e0";
  ctx.lineWidth = 1;

  // 算出 x、y 各自的理想刻度间隔
  const x理想 = 计算刻度间隔(视图范围.x最大 - 视图范围.x最小);
  const y理想 = 计算刻度间隔(视图范围.y最大 - 视图范围.y最小);

  // 取两者中较大的作为统一刻度间隔,让 x、y 一致 → 格子是正方形
  const 刻度间隔 = Math.max(x理想, y理想);

  const x刻度间隔 = 刻度间隔;
  const y刻度间隔 = 刻度间隔;

  // 竖直网格线：从 x最小 到 x最大，每隔一个刻度间隔一条
  for (let x = Math.ceil(视图范围.x最小 / x刻度间隔) * x刻度间隔; x <= 视图范围.x最大; x += x刻度间隔) {
    const 上端 = 数学转像素(x, 视图范围.y最大, 画布宽, 画布高, 视图范围);
    const 下端 = 数学转像素(x, 视图范围.y最小, 画布宽, 画布高, 视图范围);
    ctx.beginPath();
    ctx.moveTo(上端.像素x, 上端.像素y);
    ctx.lineTo(下端.像素x, 下端.像素y);
    ctx.stroke();
  }

  // 水平网格线：从 y最小 到 y最大，每隔一个刻度间隔一条
  for (let y = Math.ceil(视图范围.y最小 / y刻度间隔) * y刻度间隔; y <= 视图范围.y最大; y += y刻度间隔) {
    const 左端 = 数学转像素(视图范围.x最小, y, 画布宽, 画布高, 视图范围);
    const 右端 = 数学转像素(视图范围.x最大, y, 画布宽, 画布高, 视图范围);
    ctx.beginPath();
    ctx.moveTo(左端.像素x, 左端.像素y);
    ctx.lineTo(右端.像素x, 右端.像素y);
    ctx.stroke();
  }
}

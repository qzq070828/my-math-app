// 画坐标轴 - 画出 x 轴和 y 轴，并标注刻度数字
import { 数学转像素 } from "../../utils/mathToScreen";
import { 计算刻度间隔 } from "../../utils/niceNumber";

export function 画坐标轴(ctx, 画布宽, 画布高, 视图范围) {
  ctx.strokeStyle = "#333333";
  ctx.lineWidth = 2;

  // x 轴（y=0）
  const x轴左 = 数学转像素(视图范围.x最小, 0, 画布宽, 画布高, 视图范围);
  const x轴右 = 数学转像素(视图范围.x最大, 0, 画布宽, 画布高, 视图范围);
  ctx.beginPath();
  ctx.moveTo(x轴左.像素x, x轴左.像素y);
  ctx.lineTo(x轴右.像素x, x轴右.像素y);
  ctx.stroke();

  // y 轴（x=0）
  const y轴下 = 数学转像素(0, 视图范围.y最小, 画布宽, 画布高, 视图范围);
  const y轴上 = 数学转像素(0, 视图范围.y最大, 画布宽, 画布高, 视图范围);
  ctx.beginPath();
  ctx.moveTo(y轴下.像素x, y轴下.像素y);
  ctx.lineTo(y轴上.像素x, y轴上.像素y);
  ctx.stroke();

  // ---- 计算刻度间隔（和网格保持一致，数字才能标在网格线上）----
  const x理想 = 计算刻度间隔(视图范围.x最大 - 视图范围.x最小);
  const y理想 = 计算刻度间隔(视图范围.y最大 - 视图范围.y最小);
  const 刻度间隔 = Math.max(x理想, y理想);

  // ---- 刻度数字 ----
  ctx.fillStyle = "#333333";
  ctx.font = "bold 14px sans-serif"; // 加大加粗

  // x 轴刻度数字：在每个刻度 x 处标数字
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  for (let x = Math.ceil(视图范围.x最小 / 刻度间隔) * 刻度间隔; x <= 视图范围.x最大; x += 刻度间隔) {
    if (Math.abs(x) < 刻度间隔 / 2) continue; // 跳过原点，避免和 y 轴数字重叠
    const 点 = 数学转像素(x, 0, 画布宽, 画布高, 视图范围);
    ctx.fillText(格式化数字(x), 点.像素x, 点.像素y + 4); // 标在 x 轴下方一点
  }

  // y 轴刻度数字：在每个刻度 y 处标数字
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (let y = Math.ceil(视图范围.y最小 / 刻度间隔) * 刻度间隔; y <= 视图范围.y最大; y += 刻度间隔) {
    if (Math.abs(y) < 刻度间隔 / 2) continue;
    const 点 = 数学转像素(0, y, 画布宽, 画布高, 视图范围);
    ctx.fillText(格式化数字(y), 点.像素x - 6, 点.像素y); // 标在 y 轴左侧一点
  }
}

// 格式化数字：避免浮点误差导致的一长串小数（比如 0.30000000004）
function 格式化数字(值) {
  // 四舍五入到最多 10 位小数，再去掉多余的 0
  return parseFloat(值.toFixed(10)).toString();
}

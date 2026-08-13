// 画切线 - 在指定点画出函数的切线，并标出切点
import { 数学转像素 } from "../../utils/mathToScreen";

// 切线只在切点两侧画一小段，长度 = 视野宽度 × 这个比例
const 半长比例 = 0.15;

// 参数：画布上下文、原函数、切点的 x、斜率、画布宽高、视图范围、切线颜色
export function 画切线(
  ctx,
  计算函数,
  切点x,
  斜率,
  画布宽,
  画布高,
  视图范围,
  切线颜色 = "#e11d48"
) {
  const 切点y = 计算函数(切点x);

  // 切点无定义（比如 1/x 在 x=0），或斜率算不出来 → 不画
  if (!Number.isFinite(切点y) || !Number.isFinite(斜率)) return;

  // 以切点为中心，左右各延伸一段（跟着缩放走，不会太长或太短）
  const 半长 = (视图范围.x最大 - 视图范围.x最小) * 半长比例;
  const 左x = 切点x - 半长;
  const 右x = 切点x + 半长;

  // 切线方程：y = 切点y + 斜率 × (x - 切点x)
  const 左y = 切点y + 斜率 * (左x - 切点x);
  const 右y = 切点y + 斜率 * (右x - 切点x);

  const 左端 = 数学转像素(左x, 左y, 画布宽, 画布高, 视图范围);
  const 右端 = 数学转像素(右x, 右y, 画布宽, 画布高, 视图范围);

  // 切线本体
  ctx.strokeStyle = 切线颜色;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(左端.像素x, 左端.像素y);
  ctx.lineTo(右端.像素x, 右端.像素y);
  ctx.stroke();

  // 切点：实心圆，让「切在哪」看得见
  const 切点像素 = 数学转像素(切点x, 切点y, 画布宽, 画布高, 视图范围);
  ctx.fillStyle = 切线颜色;
  ctx.beginPath();
  ctx.arc(切点像素.像素x, 切点像素.像素y, 5, 0, Math.PI * 2);
  ctx.fill();

  // 白色描边，让圆点在曲线上也能看清
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.stroke();
}

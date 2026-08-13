// 十字准星 + 坐标读数 - 鼠标悬停时显示位置和各函数在该处的值
import { 数学转像素 } from "../../utils/mathToScreen";

export function 画十字准星(
  ctx,
  数学x,
  数学y,
  画布宽,
  画布高,
  视图范围,
  读数列表
) {
  const 点 = 数学转像素(数学x, 数学y, 画布宽, 画布高, 视图范围);

  // 两条淡灰虚线
  ctx.save();
  ctx.strokeStyle = "#aaa";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(点.像素x, 0);
  ctx.lineTo(点.像素x, 画布高);
  ctx.moveTo(0, 点.像素y);
  ctx.lineTo(画布宽, 点.像素y);
  ctx.stroke();
  ctx.restore();

  // 读数：光标坐标 + 每条函数在这个 x 处的值
  const 行列表 = [
    { 文字: `x = ${数学x.toFixed(3)}　y = ${数学y.toFixed(3)}`, 颜色: "#333" },
    ...读数列表.map((读) => ({
      文字: `${读.表达式} = ${
        Number.isFinite(读.值) ? 读.值.toFixed(3) : "无定义"
      }`,
      颜色: 读.颜色,
    })),
  ];

  ctx.save();
  ctx.font = "13px monospace";

  const 行高 = 18;
  const 内边距 = 8;
  const 框宽 =
    Math.max(...行列表.map((行) => ctx.measureText(行.文字).width)) + 内边距 * 2;
  const 框高 = 行列表.length * 行高 + 内边距 * 2;

  // 默认放在光标右下；贴边时翻到另一侧，避免被裁掉
  let 框x = 点.像素x + 12;
  let 框y = 点.像素y + 12;
  if (框x + 框宽 > 画布宽) 框x = 点.像素x - 框宽 - 12;
  if (框y + 框高 > 画布高) 框y = 点.像素y - 框高 - 12;

  ctx.fillStyle = "rgba(255,255,255,0.94)";
  ctx.strokeStyle = "#ccc";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.rect(框x, 框y, 框宽, 框高);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  行列表.forEach((行, i) => {
    ctx.fillStyle = 行.颜色;
    ctx.fillText(行.文字, 框x + 内边距, 框y + 内边距 + i * 行高);
  });

  ctx.restore();
}

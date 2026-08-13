// 计算曲线点 - 在视野范围内取样，得到一串 {x, y}
//
// 采样数由调用方按画布像素给（通常 = 画布宽 × 2）。
// 固定 500 点在宽画布上间隔约 2.7 像素，函数周期接近这个间隔时
// 会发生频闪（aliasing），屏幕上拼出一条根本不存在的慢波。
// 密度跟着像素走，假波形的波长被压到 2px 以下，视觉上自然消失。

const 最少采样 = 600;
const 最多采样 = 4000; // 上限保护，防止极端参数卡死页面

export function 计算曲线点(计算函数, 视图范围, 采样数 = 1200) {
  const n = Math.max(最少采样, Math.min(最多采样, Math.round(采样数)));
  const 点数组 = [];
  const 步长 = (视图范围.x最大 - 视图范围.x最小) / n;

  for (let i = 0; i <= n; i++) {
    const x = 视图范围.x最小 + i * 步长;
    let y;
    try {
      y = 计算函数(x);
    } catch {
      y = NaN;
    }
    点数组.push({ x, y: Number.isFinite(y) ? y : NaN });
  }

  return 点数组;
}

// 骨架采样 - 阶段[1]
//
// 均匀撒点，每 2 像素一个。作用只有一个：
// 保证任何宽于 2 像素的特征至少被一个区间跨住。
// 自适应精化找不到它从没跨过的东西 —— 骨架是保底网。
//
// 均匀网格之外再注入「整齐点」（视野内的整数、半整数）：
// 可去间断（sin(x)^2/x 在 0、(x²-4)/(x-2) 在 2）只有采样点恰好踩中
// 那个 x 才能算出 NaN、进而被分类器识别出空心圈；纯均匀网格视野一偏
// 就踩空，洞就永远隐身。教学函数的断点几乎都在整齐点上。
// 注得起才注：整齐点总数超过骨架点数的四分之一，说明缩得太远，
// 洞本来就亚像素不可见，不注。

export function 骨架采样(求值, 起点x, 终点x, 画布宽) {
  const 点数 = Math.max(64, Math.round(画布宽 / 2));
  const 步长 = (终点x - 起点x) / 点数;

  const 点集 = new Set();
  for (let i = 0; i <= 点数; i++) {
    点集.add(起点x + i * 步长);
  }

  // 整齐点注入：先整数，装得下再装半整数
  const 注入上限 = Math.floor(点数 / 4);
  const 整数列 = [];
  for (let n = Math.ceil(起点x); n <= Math.floor(终点x); n++) 整数列.push(n);
  if (整数列.length > 0 && 整数列.length <= 注入上限) {
    for (const n of 整数列) 点集.add(n);
    const 半整列 = [];
    for (let n = Math.ceil(起点x * 2) / 2; n <= 终点x; n += 0.5) {
      if (!Number.isInteger(n)) 半整列.push(n);
    }
    if (整数列.length + 半整列.length <= 注入上限) {
      for (const n of 半整列) 点集.add(n);
    }
  }

  const xs = [...点集].sort((a, b) => a - b);

  // 网格点正好就是整齐点时会产生零宽区间，滤掉几乎重合的点
  const 最幼距 = 步长 * 1e-6;
  const 点列 = [xs[0]];
  for (let i = 1; i < xs.length; i++) {
    if (xs[i] - 点列[点列.length - 1] > 最幼距) 点列.push(xs[i]);
  }

  const 区间列表 = new Array(点列.length - 1);
  let 前y = 求值(点列[0]); // 相邻区间共享端点，每个 x 只算一次
  for (let i = 1; i < 点列.length; i++) {
    const y = 求值(点列[i]);
    区间列表[i - 1] = { 左x: 点列[i - 1], 左y: 前y, 右x: 点列[i], 右y: y };
    前y = y;
  }
  return 区间列表;
}

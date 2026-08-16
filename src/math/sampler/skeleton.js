// 骨架采样 - 阶段[1]
//
// 均匀撒点，每 2 像素一个。作用只有一个：
// 保证任何宽于 2 像素的特征至少被一个区间跨住。
// 自适应精化找不到它从没跨过的东西 —— 骨架是保底网。

export function 骨架采样(求值, 起点x, 终点x, 画布宽) {
  const 点数 = Math.max(64, Math.round(画布宽 / 2));
  const 步长 = (终点x - 起点x) / 点数;

  const xs = new Array(点数 + 1);
  const ys = new Array(点数 + 1);
  for (let i = 0; i <= 点数; i++) {
    const x = 起点x + i * 步长;
    xs[i] = x;
    ys[i] = 求值(x); // 相邻区间共享端点，每个 x 只算一次
  }

  const 区间列表 = new Array(点数);
  for (let i = 0; i < 点数; i++) {
    区间列表[i] = { 左x: xs[i], 左y: ys[i], 右x: xs[i + 1], 右y: ys[i + 1] };
  }
  return 区间列表;
}

// 数值积分
//
// 两个函数分工不同：
//   求黎曼和 —— 看的，n 可调，课堂的方法
//   求参考值 —— 算误差用的，用辛普森法精度高

// 生成矩形列表：每个 { 左x, 右x, 高 }
// 端点方式：'左' / '右' / '中' —— 决定矩形的高取哪个位置的函数值
export function 生成矩形列表(计算函数, 下限, 上限, 分割数, 端点方式 = "右") {
  const 列表 = [];
  if (!Number.isFinite(下限) || !Number.isFinite(上限)) return 列表;
  if (下限 === 上限 || 分割数 < 1) return 列表;

  const 左 = Math.min(下限, 上限);
  const 右 = Math.max(下限, 上限);
  const 宽 = (右 - 左) / 分割数;

  for (let i = 0; i < 分割数; i++) {
    const 左x = 左 + i * 宽;
    const 右x = 左x + 宽;
    const 取样x =
      端点方式 === "左" ? 左x : 端点方式 === "中" ? 左x + 宽 / 2 : 右x;
    const 高 = 计算函数(取样x);
    if (Number.isFinite(高)) 列表.push({ 左x, 右x, 高 });
  }

  return 列表;
}

// 黎曼和：所有矩形面积相加
export function 求黎曼和(计算函数, 下限, 上限, 分割数, 端点方式 = "右") {
  const 列表 = 生成矩形列表(计算函数, 下限, 上限, 分割数, 端点方式);
  if (列表.length !== 分割数) return NaN; // 有点算不出来（区间内有断点）

  const 符号 = 下限 <= 上限 ? 1 : -1;
  return 符号 * 列表.reduce((和, 矩) => 和 + 矩.高 * (矩.右x - 矩.左x), 0);
}

// 参考值：辛普森法，分割数固定取很大，当作「真值」用来算误差
const 参考分割数 = 2000; // 必须是偶数

export function 求参考值(计算函数, 下限, 上限) {
  if (!Number.isFinite(下限) || !Number.isFinite(上限)) return NaN;
  if (下限 === 上限) return 0;
  if (下限 > 上限) return -求参考值(计算函数, 上限, 下限);

  const 端点左 = 计算函数(下限);
  const 端点右 = 计算函数(上限);
  if (!Number.isFinite(端点左) || !Number.isFinite(端点右)) return NaN;

  const h = (上限 - 下限) / 参考分割数;
  let 总和 = 端点左 + 端点右;

  for (let i = 1; i < 参考分割数; i++) {
    const y = 计算函数(下限 + i * h);
    if (!Number.isFinite(y)) return NaN;
    总和 += y * (i % 2 === 1 ? 4 : 2); // 辛普森权重：奇数 4，偶数 2
  }

  const 结果 = (总和 * h) / 3;
  return Number.isFinite(结果) ? 结果 : NaN;
}
// n 的逼近序列：前密后疏，让变化最明显的阶段看得清
export const n序列 = [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50, 70, 100, 140, 200];

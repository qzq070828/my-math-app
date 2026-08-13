// 数值求导 - 用中心差分近似 f'(x)

const 步长 = 1e-5;

// 求某一点的导数值
export function 求导数值(计算函数, x) {
  const 右 = 计算函数(x + 步长);
  const 左 = 计算函数(x - 步长);
  if (!Number.isFinite(右) || !Number.isFinite(左)) return NaN;
  return (右 - 左) / (2 * 步长);
}

// 把导数包装成一个「长得像原函数」的计算函数
export function 生成导函数(计算函数) {
  return (x) => 求导数值(计算函数, x);
}

// 在「这一次拖动跨过的区间」里找导数零点
// 沿拖动方向扫，返回遇到的第一个；没有返回 null
// 关键：搜索范围跟着拖动跨度走，拖多快都不会漏
export function 找区间内临界点(计算函数, 起点x, 终点x) {
  if (起点x === 终点x) return null;

  const 采样数 = 80;
  const 步 = (终点x - 起点x) / 采样数;

  let 上一个x = 起点x;
  let 上一个导数 = 求导数值(计算函数, 上一个x);

  for (let i = 1; i <= 采样数; i++) {
    const 当前x = 起点x + i * 步;
    const 当前导数 = 求导数值(计算函数, 当前x);

    // 导数变号 → 中间一定有零点（介值定理）
    if (
      Number.isFinite(上一个导数) &&
      Number.isFinite(当前导数) &&
      上一个导数 * 当前导数 < 0
    ) {
      return 二分找零点(计算函数, 上一个x, 当前x);
    }

    上一个x = 当前x;
    上一个导数 = 当前导数;
  }

  return null;
}

// 二分法逼近导数零点：区间对半砍，保留仍然变号的那一半
function 二分找零点(计算函数, 左, 右) {
  for (let i = 0; i < 40; i++) {
    const 中 = (左 + 右) / 2;
    const 左导数 = 求导数值(计算函数, 左);
    const 中导数 = 求导数值(计算函数, 中);
    if (左导数 * 中导数 <= 0) {
      右 = 中;
    } else {
      左 = 中;
    }
  }
  return (左 + 右) / 2;
}

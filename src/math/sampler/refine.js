// 精化循环 - 阶段[2]，采样架构的心脏
//
// 最大堆按「屏幕误差」排序，预算全局共享：
// 每次弹出误差最大的区间 —— 贪心，把求值集中在最需要的地方。
//
// 本版新增「变号嫌疑」：四个采样值变号 ≥2 次的区间永远不许判平。
// 之前 tan 极远视野的失败就在这：函数值折算成像素都贴着轴，
// 四个点碰巧连成平线，被误判为已解决，该进包络带的区间半路被放行。
// 平缓函数一个区间里最多变号一次，不受此规则影响。

const 黄金一 = 0.381966;
const 黄金二 = 0.618034;

const 已解决阈值 = 0.5; // 像素
const 最小宽度 = 0.05; // 像素
const 亚像素宽 = 0.75; // 像素
const 空区间标记 = -1;

// ———————— 最大堆 ————————

function 堆插入(堆, 项) {
  堆.push(项);
  let i = 堆.length - 1;
  while (i > 0) {
    const 父 = (i - 1) >> 1;
    if (堆[父].误差 >= 堆[i].误差) break;
    [堆[父], 堆[i]] = [堆[i], 堆[父]];
    i = 父;
  }
}

function 堆弹出(堆) {
  const 顶 = 堆[0];
  const 末 = 堆.pop();
  if (堆.length) {
    堆[0] = 末;
    let i = 0;
    for (;;) {
      const 左 = i * 2 + 1;
      const 右 = 左 + 1;
      let 大 = i;
      if (左 < 堆.length && 堆[左].误差 > 堆[大].误差) 大 = 左;
      if (右 < 堆.length && 堆[右].误差 > 堆[大].误差) 大 = 右;
      if (大 === i) break;
      [堆[大], 堆[i]] = [堆[i], 堆[大]];
      i = 大;
    }
  }
  return 顶;
}

// ———————— 误差函数 ————————

function 计算误差(区间, 求值, y转像素) {
  const { 左x, 左y, 右x, 右y } = 区间;

  const p1x = 左x + (右x - 左x) * 黄金一;
  const p2x = 左x + (右x - 左x) * 黄金二;
  if (!(左x < p1x && p1x < p2x && p2x < 右x)) return 0; // 浮点分不开了

  const y1 = 求值(p1x);
  const y2 = 求值(p2x);

  // 记录见过的极值（预算耗尽 → 包络带用）
  let 小 = Infinity;
  let 大 = -Infinity;
  for (const v of [左y, 右y, y1, y2]) {
    if (Number.isFinite(v)) {
      if (v < 小) 小 = v;
      if (v > 大) 大 = v;
    }
  }
  区间.极小 = 小;
  区间.极大 = 大;

  const 左有 = Number.isFinite(左y);
  const 右有 = Number.isFinite(右y);

  if (!左有 && !右有) {
    return Number.isFinite(y1) || Number.isFinite(y2)
      ? Infinity
      : 空区间标记;
  }
  if (左有 !== 右有) return Infinity; // 内含定义域边界
  if (!Number.isFinite(y1) || !Number.isFinite(y2)) return Infinity; // 内含缺口

  // 变号嫌疑：按 x 顺序数严格变号次数
  const 序 = [左y, y1, y2, 右y];
  let 变号 = 0;
  for (let i = 1; i < 4; i++) {
    if (序[i - 1] * 序[i] < 0) 变号++;
  }
  区间.变号数 = 变号;

  const 左py = y转像素(左y);
  const 右py = y转像素(右y);
  区间.py = { 左: 左py, 右: 右py, p1: y转像素(y1), p2: y转像素(y2) };

  // 变号 ≥2 → 藏着采样分辨不出的结构，禁止判平，必须细分
  if (变号 >= 2) return Infinity;

  const e1 = Math.abs(区间.py.p1 - (左py + (右py - 左py) * 黄金一));
  const e2 = Math.abs(区间.py.p2 - (左py + (右py - 左py) * 黄金二));
  return Math.max(e1, e2);
}

// 亚像素宽 + 探测值没跑出端点范围 + 一端已冲出画布 → 放行为弦
// （极点两侧的坡靠这个画到画布边缘；floor 的台阶两端都在画布内 → 不放行）
function 亚像素可解(区间, 每单位像素x, 画布高) {
  if ((区间.变号数 || 0) >= 2) return false; // 嫌疑区间必须见底
  const 宽 = (区间.右x - 区间.左x) * 每单位像素x;
  if (宽 > 亚像素宽) return false;

  const c = 区间.py;
  if (!c) return false;

  const 低 = Math.min(c.左, c.右) - 已解决阈值;
  const 高 = Math.max(c.左, c.右) + 已解决阈值;
  if (c.p1 < 低 || c.p1 > 高 || c.p2 < 低 || c.p2 > 高) return false;

  const 出画布 = (py) => py < 0 || py > 画布高;
  return 出画布(c.左) || 出画布(c.右);
}

// ———————— 求值器 ————————

export function 造求值器(计算函数, 总预算) {
  const 器 = {
    剩余: 总预算,
    次数: 0,
    求值(x) {
      器.剩余--;
      器.次数++;
      try {
        const y = 计算函数(x);
        return Number.isFinite(y) ? y : NaN;
      } catch {
        return NaN;
      }
    },
  };
  return 器;
}

// ———————— 主循环 ————————

export function 精化(骨架区间, 求值器, 环境) {
  const { y转像素, 每单位像素x, 画布高 } = 环境;

  const 已解决 = [];
  const 特征 = [];
  const 未精化 = [];
  const 空区间 = [];
  const 堆 = [];
  let 分裂次数 = 0;

  const 归类 = (区间) => {
    区间.误差 = 计算误差(区间, 求值器.求值, y转像素);
    if (区间.误差 === 空区间标记) 空区间.push(区间);
    else if (区间.误差 <= 已解决阈值) 已解决.push(区间);
    else if (亚像素可解(区间, 每单位像素x, 画布高)) 已解决.push(区间);
    else 堆插入(堆, 区间);
  };

  for (const 区间 of 骨架区间) 归类(区间);

  while (堆.length) {
    if (求值器.剩余 <= 0) {
      while (堆.length) 未精化.push(堆弹出(堆));
      break;
    }

    const 区间 = 堆弹出(堆);
    const 像素宽 = (区间.右x - 区间.左x) * 每单位像素x;

    if (像素宽 < 最小宽度) {
      特征.push(区间);
      continue;
    }

    const 中x = (区间.左x + 区间.右x) / 2;
    if (中x <= 区间.左x || 中x >= 区间.右x) {
      特征.push(区间);
      continue;
    }

    const 中y = 求值器.求值(中x);
    分裂次数++;
    归类({ 左x: 区间.左x, 左y: 区间.左y, 右x: 中x, 右y: 中y });
    归类({ 左x: 中x, 左y: 中y, 右x: 区间.右x, 右y: 区间.右y });
  }

  const 按x = (a, b) => a.左x - b.左x;
  已解决.sort(按x);
  特征.sort(按x);
  未精化.sort(按x);
  空区间.sort(按x);

  return {
    已解决,
    特征,
    未精化,
    空区间,
    统计: { 求值次数: 求值器.次数, 分裂次数 },
  };
}

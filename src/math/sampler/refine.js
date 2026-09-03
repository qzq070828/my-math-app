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
const 亚像素宽 = 2; // 像素：悬崖弦的横向误差 ≤ 这个宽度，肉眼不可辨
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

function 计算误差(区间, 求值, y转像素, 每单位像素x, 画布高) {
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

  // 满高连接嫌疑：两端从画布上下两侧都冲出去了，弦是一条穿过整屏的
  // 斜线 —— 这正是极点的长相。垂直度量对近竖直的弦会退化放行，
  // 必须强制细分：真陡坡过零拆一两次就能正常解决，
  // 真极点怎么拆都还是这个长相，最后进特征通道画渐近尾巴。
  if ((左py < 0 && 右py > 画布高) || (左py > 画布高 && 右py < 0)) {
    return Infinity;
  }

  // 量「垂直于弦」的像素偏差，而不是竖直偏差：
  // 近竖直的光滑坡（sec/tan 侧坡、贴轴段）竖直偏差天然巨大，
  // 被迫细分到 0.05px 纯属浪费 —— 肉眼看到的错位是垂直方向的，
  // 除以 √(1+斜率²)，平缓处几乎不变。
  //
  // 两种形状不能放宽，必须回到竖直度量、细分到底：
  //  · 台阶：两个探测点都贴在某个端点值上（平台-跳变-平台），
  //    竖直偏差不随细分缩小，放宽会把 floor 的台阶画成假竖线；
  //  · 非单调：四个采样值忽上忽下（稠密振荡走样、内含极值），
  //    近竖直的弦会碰巧「垂直距离很小」把 aliasing 垃圾放行。
  // 光滑陡坡单调、且至少一个探测点落在两端值之间，两条都不沾。
  const 宽px = (右x - 左x) * 每单位像素x;
  const 弦斜率 = 宽px > 0 ? (右py - 左py) / 宽px : 0;
  const 贴端 = (py) =>
    Math.abs(py - 左py) <= 已解决阈值 || Math.abs(py - 右py) <= 已解决阈值;
  const 像台阶 =
    Math.abs(右py - 左py) > 2 && 贴端(区间.py.p1) && 贴端(区间.py.p2);
  const 序py = [左py, 区间.py.p1, 区间.py.p2, 右py];
  let 单调升 = true;
  let 单调降 = true;
  for (let i = 1; i < 4; i++) {
    if (序py[i] < 序py[i - 1] - 已解决阈值) 单调升 = false;
    if (序py[i] > 序py[i - 1] + 已解决阈值) 单调降 = false;
  }
  const 可放宽 = !像台阶 && (单调升 || 单调降);
  const 垂直因子 = 可放宽 ? Math.sqrt(1 + 弦斜率 * 弦斜率) : 1;
  const e1 = Math.abs(区间.py.p1 - (左py + (右py - 左py) * 黄金一)) / 垂直因子;
  const e2 = Math.abs(区间.py.p2 - (左py + (右py - 左py) * 黄金二)) / 垂直因子;
  return Math.max(e1, e2);
}

// 亚像素宽 + 探测值没跑出端点范围 + 一端已冲出画布 → 放行为弦
// （极点两侧的坡靠这个画到画布边缘；floor 的台阶两端都在画布内 → 不放行）
// 变号必须一次都没有：单个极点的变号恰好是 1，放行的话
// 会把「+500 → -500」当成悬崖，画出一条穿过极点的假斜线。
function 亚像素可解(区间, 每单位像素x, 画布高) {
  if ((区间.变号数 || 0) >= 1) return false; // 有变号就必须见底
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
    区间.误差 = 计算误差(区间, 求值器.求值, y转像素, 每单位像素x, 画布高);
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

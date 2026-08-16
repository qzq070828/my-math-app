// 特征分类 - 阶段[3]
//
// 两条通道：
//   普通特征（变号 ≤1）→ 逐点极限探测：边界/极点/跳跃/连续
//   密集区间（变号 ≥2 的特征 + 全部未精化）→ 按「连续的一串」分组，
//     每串取一个代表：探出极点 → 整串满高实心带（tan 极远视野）；
//     否则 → 有界带，各区间用自己观测到的 min/max（sin(20x)、sin(1/x)）
//
// 代表探测前必须「缩窄到孤立」：极远视野下代表区间里有十几个极点，
// 直接探测的第一步 ε 就跨过好几个周期，值忽大忽小，判不出单调发散。
// 反复八等分、只留相邻落差最大的那一份，缩到只剩一个特征，探测才有意义。

const 探测级数 = 12;
const 收敛像素 = 0.25;
const 无穷倍数 = 4;
const 连续像素 = 0.75;
const 分类总预算 = 20000;
const 串间隙像素 = 4;
const 缩窄轮数 = 14;
const 缩窄份数 = 8;

function 包一层(计算函数) {
  return (x) => {
    try {
      const y = 计算函数(x);
      return Number.isFinite(y) ? y : NaN;
    } catch {
      return NaN;
    }
  };
}

// 反复八等分、只留「相邻落差最大」的那一份，逼出一个孤立的可疑点。
// 途中一旦看到「相邻两点符号相反、且两点都冲出画布很多倍」→ 直接判极点。
// 返回 { a, b, 疑似极点 }
function 缩窄(f, a, b, y转像素, 画布高, 花) {
  const 出很远 = (y) => {
    const py = y转像素(y);
    return py < -无穷倍数 * 画布高 || py > (1 + 无穷倍数) * 画布高;
  };

  for (let 轮 = 0; 轮 < 缩窄轮数; 轮++) {
    const 步 = (b - a) / 缩窄份数;
    if (!(步 > 0)) break; // 浮点分不开了

    let 最佳i = 1;
    let 最佳落差 = -1;
    let 前y = f(a);
    花(1);

    for (let i = 1; i <= 缩窄份数; i++) {
      const x = a + i * 步;
      const y = f(x);
      花(1);

      // 极点特征：两侧都巨大且符号相反 —— 不用再缩，直接定案
      if (
        Number.isFinite(前y) &&
        Number.isFinite(y) &&
        前y * y < 0 &&
        出很远(前y) &&
        出很远(y)
      ) {
        return { a: x - 步, b: x, 疑似极点: true };
      }

      // NaN 边界也算最大落差 —— 往定义域边界那边缩
      const 落差 =
        Number.isFinite(前y) && Number.isFinite(y)
          ? Math.abs(y - 前y)
          : Infinity;
      if (落差 > 最佳落差) {
        最佳落差 = 落差;
        最佳i = i;
      }
      前y = y;
    }

    b = a + 最佳i * 步;
    a = b - 步;
  }
  return { a, b, 疑似极点: false };
}

function 定位(f, a, b, 花) {
  let fa = f(a);
  let fb = f(b);
  花(2);

  for (let i = 0; i < 30; i++) {
    const m = (a + b) / 2;
    if (m <= a || m >= b) break;
    const fm = f(m);
    花(1);

    if (Number.isFinite(fa) !== Number.isFinite(fb)) {
      if (Number.isFinite(fm) === Number.isFinite(fa)) {
        a = m;
        fa = fm;
      } else {
        b = m;
        fb = fm;
      }
    } else if (Math.abs(fm - fa) >= Math.abs(fb - fm)) {
      b = m;
      fb = fm;
    } else {
      a = m;
      fa = fm;
    }
  }
  return (a + b) / 2;
}

function 探侧(f, c, 方向, ε0, y转像素, 画布高, 花) {
  const 值列 = [];
  let 连续NaN = 0;

  for (let k = 1; k <= 探测级数; k++) {
    const x = c + 方向 * (ε0 / Math.pow(2, k));
    if (x === c) break;
    const y = f(x);
    花(1);
    if (Number.isFinite(y)) {
      值列.push(y);
      连续NaN = 0;
    } else {
      连续NaN++;
      if (连续NaN >= 3) return { 类型: "无定义" };
    }
  }

  if (值列.length < 3) return { 类型: "无定义" };

  const 末 = 值列[值列.length - 1];
  let 递增 = 0;
  for (let i = 1; i < 值列.length; i++) {
    if (Math.abs(值列[i]) > Math.abs(值列[i - 1])) 递增++;
  }
  const 末py = y转像素(末);
  const 冲出很远 = 末py < -无穷倍数 * 画布高 || 末py > (1 + 无穷倍数) * 画布高;
  if (冲出很远 && 递增 >= 值列.length - 2) return { 类型: "无穷", 值: 末 };

  const n = 值列.length;
  const 差1 = Math.abs(y转像素(值列[n - 1]) - y转像素(值列[n - 2]));
  const 差2 = Math.abs(y转像素(值列[n - 2]) - y转像素(值列[n - 3]));
  if (差1 < 收敛像素 && 差2 < 收敛像素) return { 类型: "收敛", 值: 末 };

  return { 类型: "震荡", 值列 };
}

// 返回 { 逐点: [...], 带段: [...] }
//   逐点：'边界' | '极点' | '跳跃' | '连续' | '震荡' | '空'
//   带段：{ 左x, 右x, 最小, 最大, 满高 }
export function 分类特征(特征列表, 未精化列表, 计算函数, 环境) {
  const { y转像素, 画布高, 每单位像素x } = 环境;
  const f = 包一层(计算函数);

  let 剩余 = 分类总预算;
  const 花 = (n) => {
    剩余 -= n;
  };

  // —— 分流 ——
  const 普通 = [];
  const 密集 = [];
  for (const r of 特征列表) {
    if ((r.变号数 || 0) >= 2) 密集.push(r);
    else 普通.push(r);
  }
  for (const r of 未精化列表) 密集.push(r);
  密集.sort((a, b) => a.左x - b.左x);

  // —— 密集区间归串 ——
  const 串列表 = [];
  for (const r of 密集) {
    const 上 = 串列表[串列表.length - 1];
    if (上 && (r.左x - 上.右x) * 每单位像素x <= 串间隙像素) {
      if (r.右x > 上.右x) 上.右x = r.右x;
      上.成员.push(r);
    } else {
      串列表.push({ 左x: r.左x, 右x: r.右x, 成员: [r], 满高: false });
    }
  }

  // —— 每串探测一个代表。宽的串先探：
  //    满高占比按宽度算，预算不够时优先保住大头 ——
  const 探测顺序 = [...串列表].sort(
    (a, b) => (b.右x - b.左x) - (a.右x - a.左x)
  );
  for (const 串 of 探测顺序) {
    if (剩余 <= 0) break;
    const 代表 = 串.成员[串.成员.length >> 1];
    const 窄 = 缩窄(f, 代表.左x, 代表.右x, y转像素, 画布高, 花);
    if (窄.疑似极点) {
      串.满高 = true;
      continue;
    }
    const c = 定位(f, 窄.a, 窄.b, 花);
    const ε0 = 窄.b - 窄.a;
    const 左 = 探侧(f, c, -1, ε0, y转像素, 画布高, 花);
    const 右 = 探侧(f, c, +1, ε0, y转像素, 画布高, 花);
    串.满高 = 左.类型 === "无穷" || 右.类型 === "无穷";
  }

  const 带段 = [];
  for (const 串 of 串列表) {
    for (const r of 串.成员) {
      带段.push({
        左x: r.左x,
        右x: r.右x,
        最小: r.极小,
        最大: r.极大,
        满高: 串.满高,
      });
    }
  }

  // —— 普通特征逐点分类 ——
  const 逐点 = [];
  for (const 区间 of 普通) {
    const 基础 = {
      左x: 区间.左x,
      右x: 区间.右x,
      左y: 区间.左y,
      右y: 区间.右y,
    };

    if (剩余 <= 0) {
      逐点.push({ ...基础, 类型: "跳跃" }); // 断开是安全默认，不画假竖线
      continue;
    }

    const c = 定位(f, 区间.左x, 区间.右x, 花);
    const ε0 = 区间.右x - 区间.左x;
    const 左 = 探侧(f, c, -1, ε0, y转像素, 画布高, 花);
    const 右 = 探侧(f, c, +1, ε0, y转像素, 画布高, 花);

    if (左.类型 === "无穷" || 右.类型 === "无穷") {
      逐点.push({ ...基础, 类型: "极点", c });
    } else if (左.类型 === "震荡" || 右.类型 === "震荡") {
      let 小 = Infinity;
      let 大 = -Infinity;
      for (const v of [
        区间.左y,
        区间.右y,
        ...(左.值列 || []),
        ...(右.值列 || []),
      ]) {
        if (Number.isFinite(v)) {
          if (v < 小) 小 = v;
          if (v > 大) 大 = v;
        }
      }
      逐点.push({ ...基础, 类型: "震荡", 最小: 小, 最大: 大 });
    } else if (左.类型 === "无定义" && 右.类型 === "无定义") {
      逐点.push({ ...基础, 类型: "空" });
    } else if (左.类型 === "无定义") {
      逐点.push({ ...基础, 类型: "边界", 有定义侧: "右" });
    } else if (右.类型 === "无定义") {
      逐点.push({ ...基础, 类型: "边界", 有定义侧: "左" });
    } else {
      const 差 = Math.abs(y转像素(左.值) - y转像素(右.值));
      逐点.push(
        差 > 连续像素 ? { ...基础, 类型: "跳跃" } : { ...基础, 类型: "连续" }
      );
    }
  }

  return { 逐点, 带段 };
}

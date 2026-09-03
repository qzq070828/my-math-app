// 特征分类 - 阶段[3]
//
// 两条通道：
//   普通特征（变号 ≤1）→ 逐点极限探测：边界/极点/跳跃/连续
//   密集区间（变号 ≥2 的特征 + 全部未精化）→ 按「连续的一串」分组，
//     每串取一个代表：探出极点 → 窄串画渐近尾巴、宽串满高实心带；
//     否则 → 有界带，各区间用自己观测到的 min/max（sin(20x)、sin(1/x)）
//
// 代表探测前必须「缩窄到孤立」：极远视野下代表区间里有十几个极点，
// 直接探测的第一步 ε 就跨过好几个周期，值忽大忽小，判不出单调发散。
// 反复八等分、只留相邻落差最大的那一份，缩到只剩一个特征，探测才有意义。
//
// 顺带产出断点标记：
//   空心圆 —— 函数在该点无定义、但单侧/双侧极限有限（可去间断、跳跃、收敛边界）
//   实心点 —— 跳跃/边界处函数恰好有定义的那一端（floor 台阶的端点）
// 极点/渐近线不出圈：那里没有有限的极限位置可标。

const 探测级数 = 12;
const 收敛像素 = 0.25;
const 无穷倍数 = 4;
const 连续像素 = 0.75;
const 分类总预算 = 20000;
const 串间隙像素 = 4;
const 缩窄轮数 = 14;
const 缩窄份数 = 8;
const 孤立极点串宽 = 6; // 像素：窄串里的孤立极点画渐近尾巴（逐点），
// 比满高实心柱干净；宽串是真·密集极点区（tan 极远视野），维持满高带
const 圈去重像素 = 2; // 一个可去间断点左右各探出一个边界特征，圈会重合，按像素去重

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
  const n = 值列.length;
  const py列 = new Array(n);
  for (let i = 0; i < n; i++) py列[i] = y转像素(值列[i]);

  const 末py = py列[n - 1];
  const 冲出很远 = 末py < -无穷倍数 * 画布高 || 末py > (1 + 无穷倍数) * 画布高;
  if (冲出很远 && 递增 >= n - 2) return { 类型: "无穷", 值: 末 };

  // 慢速发散（ln 这类弱奇点）：|y| 基本单调增长、像素步进不衰减、
  // 累计位移够大 —— 值永远冲不到「很远」（ln 每折半一次只 +0.69），
  // 但方向是恒定往外走的，再折半多少次都停不下来。
  // 必须判「无穷」让渐近尾巴画到画布边；否则落进「震荡」，
  // 画出来就是一截悬在半空的有界竖带
  let 前段和 = 0;
  let 前段数 = 0;
  let 后段和 = 0;
  let 后段数 = 0;
  for (let i = 1; i < n; i++) {
    const d = Math.abs(py列[i] - py列[i - 1]);
    if (i <= n >> 1) {
      前段和 += d;
      前段数++;
    } else {
      后段和 += d;
      后段数++;
    }
  }
  const 步进不衰减 =
    前段数 > 0 && 后段数 > 0 && 后段和 / 后段数 >= (前段和 / 前段数) * 0.7;
  const 总位移 = Math.abs(py列[n - 1] - py列[0]);
  if (递增 >= n - 2 && 步进不衰减 && 总位移 > 8) {
    return { 类型: "无穷", 值: 末 };
  }

  const 差1 = Math.abs(py列[n - 1] - py列[n - 2]);
  const 差2 = Math.abs(py列[n - 2] - py列[n - 3]);
  if (差1 < 收敛像素 && 差2 < 收敛像素) return { 类型: "收敛", 值: 末 };

  return { 类型: "震荡", 值列 };
}

// 返回 { 逐点: [...], 带段: [...], 空心圆: [...], 实心点: [...] }
//   逐点：'边界' | '极点' | '跳跃' | '连续' | '震荡' | '空'
//   带段：{ 左x, 右x, 最小, 最大, 满高 }
//   空心圆/实心点：{ x, y }（数学坐标）
export function 分类特征(特征列表, 未精化列表, 计算函数, 环境) {
  const { y转像素, 画布高, 每单位像素x } = 环境;
  const f = 包一层(计算函数);

  let 剩余 = 分类总预算;
  const 花 = (n) => {
    剩余 -= n;
  };

  const 空心圆 = [];
  const 实心点 = [];

  // 断点登记：c 处的单侧极限有限时才值得标。
  // 函数在 c 有定义 → 画实心点；与某一侧极限对不上的一侧 → 画空心圈；
  // 函数在 c 无定义 → 每侧有限极限各画一个空心圈。
  // c 是二分逼近值，带浮点尾差：直接 f(c) 会随机落到断点某一侧
  // （floor 的 ● 端忽左忽右、abs(x)/x 被误判成有定义）。
  // 吸附到附近的整齐点再判：1e-9 内贴整数/贴 0。
  const 吸附 = (v) => {
    if (Math.abs(v) < 1e-9) return 0;
    const r = Math.round(v);
    if (Math.abs(v - r) < 1e-9 * Math.max(1, Math.abs(v))) return r;
    return v;
  };
  const 登断点 = (c, 极限y列) => {
    if (!Number.isFinite(c)) return;
    const y = f(吸附(c));
    花(1);
    const 有定义 = Number.isFinite(y);
    if (有定义) 实心点.push({ x: c, y });
    for (const 极限y of 极限y列) {
      if (!Number.isFinite(极限y)) continue;
      if (有定义 && Math.abs(y转像素(y) - y转像素(极限y)) <= 连续像素)
        continue; // 这侧极限就是函数值本身，实心点已经表达了
      空心圆.push({ x: c, y: 极限y });
    }
  };

  // 同一个断点常被左右两个特征各报一次（NaN 采样点两侧各一个边界），
  // 像素级去重，避免两个圈叠在一起显得脏
  const 去重 = (点列) => {
    const 出 = [];
    for (const p of 点列) {
      const 重了 = 出.some(
        (q) =>
          Math.abs(q.x - p.x) * 每单位像素x < 圈去重像素 &&
          Math.abs(y转像素(q.y) - y转像素(p.y)) < 圈去重像素
      );
      if (!重了) 出.push(p);
    }
    return 出;
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
    const 窄串 = (串.右x - 串.左x) * 每单位像素x <= 孤立极点串宽;
    if (窄.疑似极点) {
      // 缩窄已经把一个孤立极点逼出来了：窄串发极点逐点（画两条渐近尾巴）
      if (窄串) 串.极点c = (窄.a + 窄.b) / 2;
      else 串.满高 = true;
      continue;
    }
    const c = 定位(f, 窄.a, 窄.b, 花);
    const ε0 = 窄.b - 窄.a;
    const 左 = 探侧(f, c, -1, ε0, y转像素, 画布高, 花);
    const 右 = 探侧(f, c, +1, ε0, y转像素, 画布高, 花);
    const 无穷 = 左.类型 === "无穷" || 右.类型 === "无穷";
    if (无穷 && 窄串) 串.极点c = c;
    else 串.满高 = 无穷;
  }

  const 带段 = [];
  for (const 串 of 串列表) {
    if (串.极点c !== undefined) continue; // 窄串极点改走逐点，不出实心带
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
      // 极点/渐近线：没有有限极限位置，不画圈，只把两侧尾巴画干净。
      // 发 = 发散方向（末值符号）：弱奇点（ln）尾巴在双精度极限处
      // 会停住，笔画生成靠它把发散侧直插画布边；不发散的一侧是 0，不延长
      逐点.push({
        ...基础,
        类型: "极点",
        c,
        左发: 左.类型 === "无穷" ? Math.sign(左.值) : 0,
        右发: 右.类型 === "无穷" ? Math.sign(右.值) : 0,
      });
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
      // 定义域边界（ln(x+1) 的左端、sqrt(x-2) 的左端）：
      // 有定义一侧收敛到有限值 → 在边界点上标空心圈/实心点
      逐点.push({
        ...基础,
        类型: "边界",
        有定义侧: "右",
        c,
        极限: 右.值,
      });
      登断点(c, [右.值]);
    } else if (右.类型 === "无定义") {
      逐点.push({
        ...基础,
        类型: "边界",
        有定义侧: "左",
        c,
        极限: 左.值,
      });
      登断点(c, [左.值]);
    } else {
      const 差 = Math.abs(y转像素(左.值) - y转像素(右.值));
      if (差 > 连续像素) {
        // 跳跃：两侧极限都有限 → 两个端点都要标
        // （floor 整数点：有定义的一端实心、另一端空心）
        逐点.push({
          ...基础,
          类型: "跳跃",
          c,
          左极限: 左.值,
          右极限: 右.值,
        });
        登断点(c, [左.值, 右.值]);
      } else {
        逐点.push({ ...基础, 类型: "连续" });
        // 端点之一无定义、两侧极限却相等 → 可去间断点
        // （sin(x)^2/x 在 0、(x²-4)/(x-2) 在 2）：曲线上要留空心圈
        const 含缺口 =
          !Number.isFinite(区间.左y) || !Number.isFinite(区间.右y);
        if (含缺口) {
          登断点(c, [(左.值 + 右.值) / 2]);
        }
      }
    }
  }

  // —— 窄串孤立极点 → 逐点「极点」，走尾巴逻辑，不出包络带 ——
  for (const 串 of 串列表) {
    if (串.极点c === undefined) continue;
    const 代表 = 串.成员[串.成员.length >> 1];
    逐点.push({
      左x: 代表.左x,
      左y: 代表.左y,
      右x: 代表.右x,
      右y: 代表.右y,
      类型: "极点",
      c: 串.极点c,
    });
  }

  return { 逐点, 带段, 空心圆: 去重(空心圆), 实心点: 去重(实心点) };
}

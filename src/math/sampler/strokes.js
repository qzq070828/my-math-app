// 笔画生成 - 阶段[4]
//
// 输入：已解决区间 + 逐点特征 + 带段 + 空区间
// 输出：笔画[]（折线）+ 包络带[]（{左x,右x,最小,最大,满高}）
// 渲染层拿到后零决策。

const 尾巴上限 = 40;
const 带合并像素 = 0.25;

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

export function 生成笔画(已解决, 逐点, 带段, 空区间, 计算函数, 环境) {
  const { y转像素, y逆转, 画布高, 每单位像素x } = 环境;
  const f = 包一层(计算函数);

  const 笔画 = [];
  const 包络带 = [];
  let 当前 = null;

  const 收笔 = () => {
    if (当前 && 当前.length >= 2) 笔画.push(当前);
    当前 = null;
  };

  const 落点 = (x, y) => {
    if (!Number.isFinite(y)) {
      收笔();
      return;
    }
    if (!当前) {
      当前 = [{ x, y }];
      return;
    }
    const 末 = 当前[当前.length - 1];
    if (x === 末.x) return; // 相邻区间共享端点，去重
    当前.push({ x, y });
  };

  const 出画布 = (py) => py < 0 || py > 画布高;

  // 翻边：前一个点冲出画布这一侧、后一个点冲到另一侧 ——
  // 说明定位出的 c 落在了真实极点的另一边，尾巴跨过了真极点，
  // 这种「连接」画出来就是贯穿整个画布的假竖线，必须在这里停笔
  const 翻边 = (前py, 后py) =>
    (前py < 0 && 后py > 画布高) || (前py > 画布高 && 后py < 0);

  // 跨过奇点：即使两点还在画布内，符号相反且一次跳了超过一个画布高，
  // 也只可能是跨过了真奇点（连续函数在折半逼近里不可能这么跳）
  const 跨过奇点 = (前y, y, 前py, py) =>
    前y * y < 0 && (翻边(前py, py) || Math.abs(py - 前py) > 画布高);

  const 发带 = (左x, 右x, 最小, 最大, 满高) => {
    if (!满高 && (!Number.isFinite(最小) || !Number.isFinite(最大))) return;
    const 上 = 包络带[包络带.length - 1];
    if (
      上 &&
      上.满高 === 满高 &&
      (左x - 上.右x) * 每单位像素x < 带合并像素
    ) {
      上.右x = 右x;
      if (!满高) {
        if (最小 < 上.最小) 上.最小 = 最小;
        if (最大 > 上.最大) 上.最大 = 最大;
      }
    } else {
      包络带.push({ 左x, 右x, 最小, 最大, 满高 });
    }
  };

  // 极点尾巴：向 c 折半逼近直到像素 y 冲出画布（把第一个出界点也画上）
  // 每走一步都看有没有跨过真奇点 —— c 只是近似值，可能在真极点的另一侧
  // 发 = 这一侧的发散方向（+1 向上 / -1 向下 / 0 不发散）：
  // 弱奇点（ln）发散得慢，折半到双精度极限也冲不出画布，尾巴会悬在半空；
  // 只要分类确认这一侧发散，停步时就把尾巴沿发散方向直插画布边
  const 左尾巴 = (起x, c, 发 = 0) => {
    let x = 起x;
    let 出界 = false;
    let 前y = 当前 && 当前.length ? 当前[当前.length - 1].y : NaN;
    let 前py = Number.isFinite(前y) ? y转像素(前y) : NaN;
    for (let k = 0; k < 尾巴上限; k++) {
      x = (x + c) / 2;
      if (x <= 起x || x >= c) break;
      const y = f(x);
      if (!Number.isFinite(y)) break;
      const py = y转像素(y);
      if (Number.isFinite(前y) && 跨过奇点(前y, y, 前py, py)) break;
      落点(x, y);
      前y = y;
      前py = py;
      if (出画布(py)) {
        出界 = true;
        break;
      }
    }
    if (!出界 && 发 !== 0 && 当前 && 当前.length && Number.isFinite(前py)) {
      落点(当前[当前.length - 1].x, y逆转(发 > 0 ? -2 : 画布高 + 2));
    }
  };

  const 右尾巴 = (c, 止x, 止y, 发 = 0) => {
    const 点列 = [];
    let x = 止x;
    let 出界 = false;
    let 前y = 止y;
    let 前py = Number.isFinite(止y) ? y转像素(止y) : NaN;
    for (let k = 0; k < 尾巴上限; k++) {
      x = (x + c) / 2;
      if (x <= c || x >= 止x) break;
      const y = f(x);
      if (!Number.isFinite(y)) break;
      const py = y转像素(y);
      if (Number.isFinite(前y) && 跨过奇点(前y, y, 前py, py)) break;
      点列.push({ x, y });
      前y = y;
      前py = py;
      if (出画布(py)) {
        出界 = true;
        break;
      }
    }
    // 反向绘制时列表要倒序，延到画布边的点先塞在末尾，倒序后自然在最前
    if (!出界 && 发 !== 0 && 点列.length) {
      点列.push({
        x: 点列[点列.length - 1].x,
        y: y逆转(发 > 0 ? -2 : 画布高 + 2),
      });
    }
    点列.reverse();
    for (const p of 点列) 落点(p.x, p.y);
  };

  const 时间线 = [
    ...已解决.map((r) => ({ ...r, 种: "线" })),
    ...逐点.map((r) => ({ ...r, 种: r.类型 })),
    ...带段.map((r) => ({ ...r, 种: "带" })),
    ...空区间.map((r) => ({ ...r, 种: "空" })),
  ].sort((a, b) => a.左x - b.左x);

  for (const 段 of 时间线) {
    switch (段.种) {
      case "线":
      case "连续":
        落点(段.左x, 段.左y);
        落点(段.右x, 段.右y);
        break;

      case "带":
        收笔();
        发带(段.左x, 段.右x, 段.最小, 段.最大, Boolean(段.满高));
        break;

      case "震荡":
        收笔();
        发带(段.左x, 段.右x, 段.最小, 段.最大, false);
        break;

      case "跳跃":
        落点(段.左x, 段.左y);
        if (Number.isFinite(段.c) && Number.isFinite(段.左极限))
          落点(段.c, 段.左极限); // 把线画到断点边上，空心圈正好压在端点上
        收笔(); // 台阶之间没有任何连接
        if (Number.isFinite(段.c) && Number.isFinite(段.右极限))
          落点(段.c, 段.右极限);
        落点(段.右x, 段.右y);
        break;

      case "边界":
        if (段.有定义侧 === "左") {
          落点(段.左x, 段.左y);
          if (Number.isFinite(段.c) && Number.isFinite(段.极限))
            落点(段.c, 段.极限); // 收敛边界：线一直画到边界点上
          收笔();
        } else {
          收笔();
          if (Number.isFinite(段.c) && Number.isFinite(段.极限))
            落点(段.c, 段.极限);
          落点(段.右x, 段.右y);
        }
        break;

      case "极点":
        落点(段.左x, 段.左y);
        左尾巴(段.左x, 段.c, 段.左发 || 0);
        收笔();
        右尾巴(段.c, 段.右x, 段.右y, 段.右发 || 0);
        落点(段.右x, 段.右y);
        break;

      case "空":
      default:
        收笔();
        break;
    }
  }

  收笔();
  return { 笔画, 包络带 };
}

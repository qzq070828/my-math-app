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
  const { y转像素, 画布高, 每单位像素x } = 环境;
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
  const 左尾巴 = (起x, c) => {
    let x = 起x;
    for (let k = 0; k < 尾巴上限; k++) {
      x = (x + c) / 2;
      if (x <= 起x || x >= c) break;
      const y = f(x);
      if (!Number.isFinite(y)) break;
      落点(x, y);
      if (出画布(y转像素(y))) break;
    }
  };

  const 右尾巴 = (c, 止x) => {
    const 点列 = [];
    let x = 止x;
    for (let k = 0; k < 尾巴上限; k++) {
      x = (x + c) / 2;
      if (x <= c || x >= 止x) break;
      const y = f(x);
      if (!Number.isFinite(y)) break;
      点列.push({ x, y });
      if (出画布(y转像素(y))) break;
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
        收笔(); // 台阶之间没有任何连接
        落点(段.右x, 段.右y);
        break;

      case "边界":
        if (段.有定义侧 === "左") {
          落点(段.左x, 段.左y);
          收笔();
        } else {
          收笔();
          落点(段.右x, 段.右y);
        }
        break;

      case "极点":
        落点(段.左x, 段.左y);
        左尾巴(段.左x, 段.c);
        收笔();
        右尾巴(段.c, 段.右x);
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


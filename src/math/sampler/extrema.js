// 极值精修 - 阶段[1.5]，夹在骨架和精化之间
//
// 折线的顶点必须落在真极值上，否则峰被削平、左右不对称。
// 这不是周期函数特有的，x² 的顶点同样会被削 ——
// 周期函数只是把误差重复几百次，肉眼才看成「高低不齐」。
//
// 为什么必须独立于精化循环：那是贪心堆，预算先给误差最大的区间。
// 两百个峰时一部分精修到位、一部分预算耗尽 → 峰高不一致。
// 这一层有自己的保留预算，在贪心开始前就保证每个峰拿到顶点。

const 最多迭代 = 6;
const 最小突起 = 1; // 像素。峰突起不到 1px 肉眼看不见，不值得花预算
const 收敛像素 = 0.02; // 括号窄到这个程度就够了

// Brent 式极值定位：抛物线插值为主，黄金分割兜底
// 三点括号 (a,b,c)，b 是当前最好。统一成「找最大」，找谷时把 y 取反
function 找极值(求值, a, b, c, fa, fb, fc, 花, 还有) {
  for (let k = 0; k < 最多迭代; k++) {
    if (还有() <= 0) break;
    if (c - a < 收敛像素) break;

    // 过三点的抛物线顶点
    const p = (b - a) * (b - a) * (fb - fc) - (b - c) * (b - c) * (fb - fa);
    const q = (b - a) * (fb - fc) - (b - c) * (fb - fa);
    let 新x = Math.abs(q) > 1e-300 ? b - 0.5 * (p / q) : NaN;

    // 安全网：顶点跑出括号或贴 b 太近 → 退回黄金分割，取较宽的那半
    const 太近 = Math.abs(新x - b) < (c - a) * 0.01;
    if (!Number.isFinite(新x) || 新x <= a || 新x >= c || 太近) {
      新x = b - a > c - b ? a + (b - a) * 0.618 : b + (c - b) * 0.382;
    }
    if (新x <= a || 新x >= c) break;

    const f新 = 求值(新x);
    花(1);
    if (!Number.isFinite(f新)) break;

    // 收缩括号：新点更高就成为新的中心，否则成为新的边界
    if (新x > b) {
      if (f新 > fb) {
        a = b;
        fa = fb;
        b = 新x;
        fb = f新;
      } else {
        c = 新x;
        fc = f新;
      }
    } else {
      if (f新 > fb) {
        c = b;
        fc = fb;
        b = 新x;
        fb = f新;
      } else {
        a = 新x;
        fa = f新;
      }
    }
  }
  return { x: b, f: fb };
}

// 输入骨架区间，输出「在每个极值处劈开」的新区间列表
export function 精修极值(骨架区间, 求值器, 环境, 保留预算) {
  if (骨架区间.length < 2) return 骨架区间;
  const { y转像素, 每单位像素x } = 环境;

  // 从区间列还原成点列（相邻区间共享端点）
  const xs = [骨架区间[0].左x];
  const ys = [骨架区间[0].左y];
  for (const 区 of 骨架区间) {
    xs.push(区.右x);
    ys.push(区.右y);
  }

  let 剩余 = 保留预算;
  const 花 = (n) => {
    剩余 -= n;
  };
  const 还有 = () => 剩余;

  const 插入 = [];

  for (let i = 1; i < xs.length - 1; i++) {
    if (剩余 <= 0) break;

    const a = ys[i - 1];
    const b = ys[i];
    const c = ys[i + 1];
    if (!Number.isFinite(a) || !Number.isFinite(b) || !Number.isFinite(c))
      continue;

    const 是峰 = b > a && b > c;
    const 是谷 = b < a && b < c;
    if (!是峰 && !是谷) continue;

    // 突起高度：不到 1 像素看不见，跳过
    const 突起 = Math.abs(y转像素(b) - y转像素((a + c) / 2));
    if (突起 < 最小突起) continue;

    const 符 = 是峰 ? 1 : -1;
    const 求值 = (x) => 符 * 求值器.求值(x);
    const 结 = 找极值(
      求值,
      xs[i - 1],
      xs[i],
      xs[i + 1],
      符 * a,
      符 * b,
      符 * c,
      花,
      还有
    );

    // 骨架点本身就是最好的 → 不用插
    if (结.x !== xs[i]) 插入.push({ x: 结.x, y: 符 * 结.f });
  }

  if (!插入.length) return 骨架区间;

  // 把插入点并回区间列表：包含它的那个区间劈成两半
  插入.sort((p, q) => p.x - q.x);
  const 新列表 = [];
  let j = 0;

  for (const 区 of 骨架区间) {
    let 左x = 区.左x;
    let 左y = 区.左y;
    while (j < 插入.length && 插入[j].x <= 左x) j++;
    while (j < 插入.length && 插入[j].x < 区.右x) {
      新列表.push({ 左x, 左y, 右x: 插入[j].x, 右y: 插入[j].y });
      左x = 插入[j].x;
      左y = 插入[j].y;
      j++;
    }
    新列表.push({ 左x, 左y, 右x: 区.右x, 右y: 区.右y });
  }

  return 新列表;
}

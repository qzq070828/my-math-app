// 画黎曼矩形 - 把积分区域填在曲线下方
//
// 两种画法，按矩形的像素宽度切换：
//   矩形够宽（≥ 2px）：逐个画，宽到 6px 再加边框 —— 矩形本身就是
//     这个阶段的教学内容，必须看得见一个个方块。
//   矩形亚像素（n 很大）：按屏幕像素列填充 —— n=40000 时每个矩形只有
//     约 0.005px 宽，逐个 fillRect 叠出来只是一层看不见的雾（透明度
//     0.3 × 亚像素覆盖率），还每帧白烧几万次求值。改成按像素列采样
//     函数值、每列填 [0, f(x)]，视觉和「无穷多个矩形」一致，
//     成本从 O(n) 降到 O(画布宽)。
//
// 这里只决定「怎么画」。读数条里的黎曼和数值仍由 求黎曼和() 按真实 n
// 精确计算，两边互不影响。
import { 数学转像素 } from "../../utils/mathToScreen";

const 逐列填充阈值 = 2; // 矩形像素宽低于这个就改逐列填充
const 画边框阈值 = 6; // 矩形像素宽达到这个才画边框
// （原来是按矩形个数 ≤60 判断，缩放视野后会失效；按像素宽判断在任何缩放下都对）

// 参数：ctx、原函数、积分下限、积分上限、分割数 n、端点方式（左/右/中）、
//       画布宽高、视图范围、颜色
export function 画黎曼矩形(
  ctx,
  计算函数,
  下限,
  上限,
  分割数,
  端点方式 = "右",
  画布宽,
  画布高,
  视图范围,
  颜色
) {
  if (!Number.isFinite(下限) || !Number.isFinite(上限)) return;
  if (下限 === 上限 || !(分割数 >= 1)) return;

  const 左 = Math.min(下限, 上限);
  const 右 = Math.max(下限, 上限);
  const 数学宽 = (右 - 左) / 分割数;
  const 每单位像素x = 画布宽 / (视图范围.x最大 - 视图范围.x最小);
  const 矩形像素宽 = 数学宽 * 每单位像素x;

  ctx.save();
  if (矩形像素宽 >= 逐列填充阈值) {
    逐矩形画(
      ctx,
      计算函数,
      左,
      分割数,
      数学宽,
      端点方式,
      矩形像素宽 >= 画边框阈值,
      画布宽,
      画布高,
      视图范围,
      颜色
    );
  } else {
    逐列填充(ctx, 计算函数, 左, 右, 画布宽, 画布高, 视图范围, 颜色);
  }
  ctx.restore();
}

// 逐个画矩形。只画落在视野内的：视野外的画了也会被画布裁掉，纯属浪费。
function 逐矩形画(
  ctx,
  计算函数,
  左,
  分割数,
  数学宽,
  端点方式,
  画边框,
  画布宽,
  画布高,
  视图范围,
  颜色
) {
  const 首i = Math.max(0, Math.floor((视图范围.x最小 - 左) / 数学宽));
  const 末i = Math.min(分割数 - 1, Math.ceil((视图范围.x最大 - 左) / 数学宽));

  for (let i = 首i; i <= 末i; i++) {
    const 左x = 左 + i * 数学宽;
    const 右x = 左x + 数学宽;
    const 取样x =
      端点方式 === "左" ? 左x : 端点方式 === "中" ? 左x + 数学宽 / 2 : 右x;

    let 高;
    try {
      高 = 计算函数(取样x);
    } catch {
      continue;
    }
    if (!Number.isFinite(高)) continue;

    // 顶在函数值处，底永远在 y=0（x 轴）
    const 顶 = 数学转像素(左x, 高, 画布宽, 画布高, 视图范围);
    const 底 = 数学转像素(右x, 0, 画布宽, 画布高, 视图范围);

    const 像素宽 = 底.像素x - 顶.像素x;
    const 像素高 = 底.像素y - 顶.像素y; // 函数值为负时这里是负数，fillRect 能处理

    ctx.globalAlpha = 0.3;
    ctx.fillStyle = 颜色;
    ctx.fillRect(顶.像素x, 顶.像素y, 像素宽, 像素高);

    if (画边框) {
      ctx.globalAlpha = 0.9;
      ctx.strokeStyle = 颜色;
      ctx.lineWidth = 1;
      ctx.strokeRect(顶.像素x, 顶.像素y, 像素宽, 像素高);
    }
  }
}

// 逐列填充：矩形已经亚像素，没人看得出单个矩形。
// 对每一列屏幕像素取中点采样 f，填 [0, f(x)] —— 这就是「面积」本身。
// 端点方式在这个阶段没有视觉意义（差异远小于 1px），按中点采。
function 逐列填充(ctx, 计算函数, 左, 右, 画布宽, 画布高, 视图范围, 颜色) {
  const x跨 = 视图范围.x最大 - 视图范围.x最小;
  const 列左 = Math.max(0, Math.floor(((左 - 视图范围.x最小) / x跨) * 画布宽));
  const 列右 = Math.min(
    画布宽,
    Math.ceil(((右 - 视图范围.x最小) / x跨) * 画布宽)
  );
  if (列右 < 列左) return;

  const 轴py = 数学转像素(0, 0, 画布宽, 画布高, 视图范围).像素y;

  ctx.globalAlpha = 0.3;
  ctx.fillStyle = 颜色;

  for (let px = 列左; px <= 列右; px++) {
    const 数学x = 视图范围.x最小 + ((px + 0.5) / 画布宽) * x跨;
    let 高;
    try {
      高 = 计算函数(数学x);
    } catch {
      continue;
    }
    if (!Number.isFinite(高)) continue;

    const 顶py = 数学转像素(0, 高, 画布宽, 画布高, 视图范围).像素y;
    // 高为负时高度是负数，fillRect 能处理
    ctx.fillRect(px, 顶py, 1, 轴py - 顶py);
  }
}

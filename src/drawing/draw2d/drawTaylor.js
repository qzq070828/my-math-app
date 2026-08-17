// 泰勒绘制 - 多项式曲线 + 误差填充 + 容差区间标记
//
// 纯执行层：不做任何数学判断，收到什么画什么。
// 多项式是全局光滑的（没有极点、没有跳变），所以不走采样器那套
// 骨架/精化流程，等距取点就够 —— 这是它和原函数曲线的根本区别。
//
// 误差填充在渐近线附近会炸：原函数冲向无穷、多项式是有限值，
// 中间的「误差」能填满整个画布。所以纵向做了裁剪。

// 超出画布高度这么多倍就不画，避免填充铺满屏幕
const 纵向裁剪倍数 = 1.5;

function 数学转像素x(x, 视图范围, 画布宽) {
  const { x最小, x最大 } = 视图范围;
  return ((x - x最小) / (x最大 - x最小)) * 画布宽;
}

function 数学转像素y(y, 视图范围, 画布高) {
  const { y最小, y最大 } = 视图范围;
  return 画布高 - ((y - y最小) / (y最大 - y最小)) * 画布高;
}


// 把颜色变淡：用于填充
function 淡化(颜色, 透明度) {
  // 支持 #rrggbb
  if (/^#[0-9a-f]{6}$/i.test(颜色)) {
    const r = parseInt(颜色.slice(1, 3), 16);
    const g = parseInt(颜色.slice(3, 5), 16);
    const b = parseInt(颜色.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${透明度})`;
  }
  return 颜色;
}

// ———————— 主入口 ————————
//
// 参数：
//   泰勒     取泰勒() 的返回值
//   计算函数  原函数，画误差填充要用
//   选项     { 显示误差带, 容差区间 }
export function 画泰勒(
  ctx,
  泰勒,
  计算函数,
  画布宽,
  画布高,
  视图范围,
  颜色,
  选项 = {}
) {
  if (!泰勒 || !泰勒.可用) return;

  const { x最小, x最大 } = 视图范围;
  const 采样数 = Math.max(200, Math.floor(画布宽 / 2));
  const 步长 = (x最大 - x最小) / 采样数;

  // 纵向裁剪边界（数学坐标）
  const { y最小, y最大 } = 视图范围;
  const 高度 = y最大 - y最小;
  const 裁剪上 = y最大 + 高度 * 纵向裁剪倍数;
  const 裁剪下 = y最小 - 高度 * 纵向裁剪倍数;

  // 先把点算出来，三样东西共用
  const 点列表 = [];
  for (let i = 0; i <= 采样数; i++) {
    const x = x最小 + i * 步长;
    const 近似 = 泰勒.求值(x);

    let 真值 = NaN;
    if (计算函数) {
      try {
        真值 = 计算函数(x);
      } catch {
        真值 = NaN;
      }
    }

    点列表.push({ x, 近似, 真值 });
  }

  // ———— 1. 误差填充 ————
  // 在原函数和多项式之间填色。两条线都有限、且都在裁剪范围内才填
  if (选项.显示误差带) {
    ctx.save();
    ctx.fillStyle = 淡化(颜色, 0.18);

    let 段开始 = -1;

    const 收段 = (结束) => {
      if (段开始 < 0 || 结束 <= 段开始) {
        段开始 = -1;
        return;
      }

      ctx.beginPath();
      // 沿原函数从左到右
      for (let i = 段开始; i <= 结束; i++) {
        const 点 = 点列表[i];
        const px = 数学转像素x(点.x, 视图范围, 画布宽);
        const py = 数学转像素y(点.真值, 视图范围, 画布高);
        if (i === 段开始) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      // 沿多项式从右回到左，闭合成一个带子
      for (let i = 结束; i >= 段开始; i--) {
        const 点 = 点列表[i];
        const px = 数学转像素x(点.x, 视图范围, 画布宽);
        const py = 数学转像素y(点.近似, 视图范围, 画布高);
        ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();

      段开始 = -1;
    };

    for (let i = 0; i < 点列表.length; i++) {
      const 点 = 点列表[i];
      const 有效 =
        Number.isFinite(点.真值) &&
        Number.isFinite(点.近似) &&
        点.真值 <= y最大 &&
        点.真值 >= y最小 &&
        点.近似 <= y最大 &&
        点.近似 >= y最小;


      if (有效) {
        if (段开始 < 0) 段开始 = i;
      } else {
        收段(i - 1);
      }
    }
    收段(点列表.length - 1);

    ctx.restore();
  }

  // ———— 2. 容差区间标记 ————
  // 画在多项式曲线下面，免得盖住线
  const 区间 = 选项.容差区间;
  if (区间 && 区间.可用 && Number.isFinite(区间.左) && Number.isFinite(区间.右)) {
    ctx.save();

    const 左px = 数学转像素x(区间.左, 视图范围, 画布宽);
    const 右px = 数学转像素x(区间.右, 视图范围, 画布宽);

    // 竖向淡绿带
    ctx.fillStyle = "rgba(34, 197, 94, 0.12)";
    ctx.fillRect(左px, 0, 右px - 左px, 画布高);

    // 两条边界竖线
    ctx.strokeStyle = "rgba(21, 128, 61, 0.7)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);

    ctx.beginPath();
    ctx.moveTo(左px, 0);
    ctx.lineTo(左px, 画布高);
    ctx.moveTo(右px, 0);
    ctx.lineTo(右px, 画布高);
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.restore();
  }

  // ———— 3. 多项式曲线 ————
  // 虚线，和原函数区分开。间距比导数虚线大，避免两条虚线看混
  ctx.save();
  ctx.strokeStyle = 颜色;
  ctx.lineWidth = 2.5;
  ctx.setLineDash([10, 5]);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  ctx.beginPath();
  let 落笔 = false;

  for (const 点 of 点列表) {
    if (!Number.isFinite(点.近似) || 点.近似 > 裁剪上 || 点.近似 < 裁剪下) {
      落笔 = false;
      continue;
    }

    const px = 数学转像素x(点.x, 视图范围, 画布宽);
    const py = 数学转像素y(点.近似, 视图范围, 画布高);

    if (!落笔) {
      ctx.moveTo(px, py);
      落笔 = true;
    } else {
      ctx.lineTo(px, py);
    }
  }

  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // ———— 4. 展开点标记 ————
  const a = 泰勒.展开点;
  const fa = 泰勒.导数值[0];
  if (Number.isFinite(a) && Number.isFinite(fa)) {
    const px = 数学转像素x(a, 视图范围, 画布宽);
    const py = 数学转像素y(fa, 视图范围, 画布高);

    ctx.save();
    ctx.fillStyle = 颜色;
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.arc(px, py, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 标签 a
    ctx.fillStyle = 颜色;
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("a", px, py - 10);

    ctx.restore();
  }
}

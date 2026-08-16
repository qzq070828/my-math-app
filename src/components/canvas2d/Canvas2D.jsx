import { useRef, useEffect, useState } from "react";
import { 默认视图范围, 像素转数学 } from "../../utils/mathToScreen";
import { 画网格 } from "../../drawing/draw2d/drawGrid";
import { 画坐标轴 } from "../../drawing/draw2d/drawAxes";
import { 画曲线 } from "../../drawing/draw2d/drawCurve";
import { 画切线 } from "../../drawing/draw2d/drawTangent";
import { 画点 } from "../../drawing/draw2d/drawPoint";
import { 画黎曼矩形 } from "../../drawing/draw2d/drawRiemann";
import { 画十字准星 } from "../../drawing/draw2d/drawCrosshair";
import { 画函数标签 } from "../../drawing/draw2d/drawLabel";
import { 解析表达式 } from "../../math/parse";
import { 计算曲线点 } from "../../math/evaluate";
import { 生成导函数, 求导数值 } from "../../math/derivative";
import { 生成矩形列表 } from "../../math/integral";


const 动画周期 = 6000;

// 画布宽高比和 mathToScreen 里默认视图范围的比例一致
const 宽高比 = 1.5;

function Canvas2D({ 函数列表 }) {
  const canvasRef = useRef(null);
  const 容器Ref = useRef(null);

  const [视图范围, 设置视图范围] = useState(默认视图范围);
  const [动画进度, 设置动画进度] = useState(0);
  const [画布尺寸, 设置画布尺寸] = useState({ 宽: 1200, 高: 800 });
  const [鼠标位置, 设置鼠标位置] = useState(null); 
  // 数学坐标，离开时为 null

  const 拖拽中 = useRef(false);
  const 上次鼠标 = useRef({ x: 0, y: 0 });

  const 需要动画 = 函数列表.some((项) => 项.追踪函数 || 项.追踪切线);

  // 画布跟随容器宽度，并且始终保持固定宽高比
  useEffect(() => {
    const 容器 = 容器Ref.current;
    if (!容器) return;

    function 重新测量(可用宽) {
      const 最大高 = Math.max(240, window.innerHeight - 280);
      let 宽 = Math.max(320, Math.round(可用宽));
      let 高 = Math.round(宽 / 宽高比);
      if (高 > 最大高) {
        高 = 最大高;
        宽 = Math.round(高 * 宽高比);
      }
      设置画布尺寸({ 宽, 高 });
    }

    const 观察器 = new ResizeObserver((条目) => {
      重新测量(条目[0].contentRect.width);
    });
    观察器.observe(容器);

    return () => 观察器.disconnect();
  }, []);

  // 动画循环功能：按真实时间进行，不依赖帧率无关
  useEffect(() => {
    if (!需要动画) return;

    let 帧id;
    let 起始时间 = null;

    function 每帧(时间戳) {
      if (起始时间 === null) 起始时间 = 时间戳;
      const 已过 = (时间戳 - 起始时间) % 动画周期;
      设置动画进度(已过 / 动画周期);
      帧id = requestAnimationFrame(每帧);
    }

    帧id = requestAnimationFrame(每帧);
    return () => cancelAnimationFrame(帧id);
  }, [需要动画]);

  useEffect(() => {
    const 画板 = canvasRef.current;
    if (!画板) return;

    const ctx = 画板.getContext("2d");
    const 画布宽 = 画板.width;
    const 画布高 = 画板.height;

    ctx.clearRect(0, 0, 画布宽, 画布高);
    画网格(ctx, 画布宽, 画布高, 视图范围);
    画坐标轴(ctx, 画布宽, 画布高, 视图范围);

    // 悬停读数：每条函数在光标 x 处的值 并且画完曲线后统一显示
    const 读数列表 = [];

    函数列表.forEach((项) => {
      if (!项.表达式) return;

      try {
        const 解析结果 = 解析表达式(项.表达式);
        if (!解析结果 || !解析结果.成功) return;

        const 计算函数 = 解析结果.计算函数;
        const 点数组 = 计算曲线点(计算函数, 视图范围, 画布宽/2);

        if (鼠标位置) {
          读数列表.push({
            表达式: 项.表达式,
            颜色: 项.颜色,
            值: 计算函数(鼠标位置.x),
          });
        }

        // 黎曼矩形展示功能：垫在曲线下面，优先进行
        if (项.显示积分) {
          const 当前n = Number.isFinite(项.当前n) && 项.当前n > 0 ? 项.当前n : 1;
          const 矩形列表 = 生成矩形列表(
            计算函数,
            项.积分下限,
            项.积分上限,
            当前n,
            项.端点方式
          );
          画黎曼矩形(ctx, 矩形列表, 画布宽, 画布高, 视图范围, 项.颜色);
        }

        // 原函数：追踪时只画到进度位置，否则整条画完
        if (项.追踪函数) {
          const 可见数量 = Math.max(2, Math.floor(点数组.length * 动画进度));
          const 部分点 = 点数组.slice(0, 可见数量);
          画曲线(ctx, 部分点, 画布宽, 画布高, 视图范围, 项.颜色,计算函数);

          const 末点 = 部分点[部分点.length - 1];
          if (末点) {
            画点(ctx, 末点.x, 末点.y, 画布宽, 画布高, 视图范围, 项.颜色);
          }
        } else {
          画曲线(ctx, 点数组, 画布宽, 画布高, 视图范围, 项.颜色, 计算函数);
          画函数标签(
            ctx,
            点数组,
            项.表达式,
            画布宽,
            画布高,
            视图范围,
            项.颜色
          );
        }

        // 导函数：同色虚线
        if (项.显示导数) {
          const 导函数 = 生成导函数(计算函数);
          const 导数点数组 = 计算曲线点(导函数, 视图范围, 画布宽/2);
          ctx.setLineDash([6, 4]);
          画曲线(ctx, 导数点数组, 画布宽, 画布高, 视图范围, 项.颜色, 导函数);
          ctx.setLineDash([]);
        }

        // 切线：追踪模式下切点跟着动画走，其次用滑块的值
        if (项.显示切线 || 项.追踪切线) {
          const 切点 = 项.追踪切线
            ? 视图范围.x最小 + (视图范围.x最大 - 视图范围.x最小) * 动画进度
            : Number.isFinite(项.切点x)
            ? 项.切点x
            : 0;

          const 斜率 = 求导数值(计算函数, 切点);
          画切线(ctx, 计算函数, 切点, 斜率, 画布宽, 画布高, 视图范围);
        }
      } catch (错误) {
        // 这条函数画不出来进行跳过，并且在控制台留痕，避免排查时一片空白
        console.error("画函数出错:", 项.表达式, 错误);
        ctx.setLineDash([]);
      }
    });

    // 十字准星功能，压在所有内容上面
    if (鼠标位置 && !拖拽中.current) {
      画十字准星(
        ctx,
        鼠标位置.x,
        鼠标位置.y,
        画布宽,
        画布高,
        视图范围,
        读数列表
      );
    }
  }, [函数列表, 视图范围, 动画进度, 画布尺寸, 鼠标位置]);

  // 把浏览器事件坐标换算成画布内部像素（CSS 尺寸和属性尺寸可能不等）
  function 取画布内像素(事件) {
    const 画板 = canvasRef.current;
    const 矩形 = 画板.getBoundingClientRect();
    return {
      像素x: (事件.clientX - 矩形.left) * (画板.width / 矩形.width),
      像素y: (事件.clientY - 矩形.top) * (画板.height / 矩形.height),
    };
  }

  function 处理滚轮(事件) {
    事件.preventDefault();
    const 缩放系数 = 事件.deltaY < 0 ? 0.9 : 1.1;

    设置视图范围((旧范围) => {
      const x中心 = (旧范围.x最小 + 旧范围.x最大) / 2;
      const y中心 = (旧范围.y最小 + 旧范围.y最大) / 2;
      const 新x半宽 = ((旧范围.x最大 - 旧范围.x最小) / 2) * 缩放系数;
      const 新y半高 = ((旧范围.y最大 - 旧范围.y最小) / 2) * 缩放系数;

      return {
        x最小: x中心 - 新x半宽,
        x最大: x中心 + 新x半宽,
        y最小: y中心 - 新y半高,
        y最大: y中心 + 新y半高,
      };
    });
  }

  function 处理按下(事件) {
    拖拽中.current = true;
    上次鼠标.current = { x: 事件.clientX, y: 事件.clientY };
  }

  function 处理移动(事件) {
    const 画板 = canvasRef.current;
    if (!画板) return;

    // 不拖拽时：记录光标位置，供十字准星使用
    if (!拖拽中.current) {
      const { 像素x, 像素y } = 取画布内像素(事件);
      const 数学 = 像素转数学(
        像素x,
        像素y,
        画板.width,
        画板.height,
        视图范围
      );
      设置鼠标位置({ x: 数学.数学x, y: 数学.数学y });
      return;
    }

    const 画布宽 = 画板.width;
    const 画布高 = 画板.height;

    const 像素偏移x = 事件.clientX - 上次鼠标.current.x;
    const 像素偏移y = 事件.clientY - 上次鼠标.current.y;

    设置视图范围((旧范围) => {
      const 数学每像素x = (旧范围.x最大 - 旧范围.x最小) / 画布宽;
      const 数学每像素y = (旧范围.y最大 - 旧范围.y最小) / 画布高;

      const 数学偏移x = 像素偏移x * 数学每像素x;
      const 数学偏移y = 像素偏移y * 数学每像素y;

      return {
        x最小: 旧范围.x最小 - 数学偏移x,
        x最大: 旧范围.x最大 - 数学偏移x,
        y最小: 旧范围.y最小 + 数学偏移y,
         // y 轴方向相反，所以是 +
        y最大: 旧范围.y最大 + 数学偏移y,
      };
    });

    上次鼠标.current = { x: 事件.clientX, y: 事件.clientY };
  }

  function 处理松开() {
    拖拽中.current = false;
  }

  function 处理离开() {
    拖拽中.current = false;
    设置鼠标位置(null); 
    // 光标出界就收起准星
  }

  return (
    <div ref={容器Ref} style={{ width: "100%" }}>
      <div style={{ marginBottom: "0.5rem" }}>
        <button
          onClick={() => 设置视图范围(默认视图范围)}
          style={{
            padding: "0.35rem 0.75rem",
            border: "1px solid #999",
            borderRadius: "4px",
            background: "#fff",
            cursor: "pointer",
            fontSize: "0.85rem",
          }}
        >
          ⌂ 回到初始视野
        </button>
      </div>

      <canvas
        ref={canvasRef}
        width={画布尺寸.宽}
        height={画布尺寸.高}
        style={{
          border: "1px solid #ccc",
          cursor: 拖拽中.current ? "grabbing" : "crosshair",
          display: "block",
        }}
        onWheel={处理滚轮}
        onMouseDown={处理按下}
        onMouseMove={处理移动}
        onMouseUp={处理松开}
        onMouseLeave={处理离开}
      />
    </div>
  );
}

export default Canvas2D;


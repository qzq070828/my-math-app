// 首页 - 项目介绍和入口
//
// 主视觉是一块活的画布：泰勒多项式在 P₁→P₁₁ 之间循环，
// 绿色带子是「误差 ≤ 10⁻³ 的区间」，随阶数张开。
// 这是产品最独特的一件事，所以放在第一屏，而不是写成一句口号。
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import LanguageSwitch from "../components/layout/LanguageSwitch";
import { useLanguage } from "../i18n/LanguageContext";

// ———————— 主视觉画布 ————————

function 演示画布() {
  const 画布Ref = useRef(null);

  useEffect(() => {
    const 画板 = 画布Ref.current;
    if (!画板) return;

    const ctx = 画板.getContext("2d");
    const 减少动画 = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let 宽 = 0;
    let 高 = 0;

    function 重设尺寸() {
      const 比例 = Math.min(window.devicePixelRatio || 1, 2);
      宽 = 画板.clientWidth;
      高 = 画板.clientHeight;
      画板.width = 宽 * 比例;
      画板.height = 高 * 比例;
      ctx.setTransform(比例, 0, 0, 比例, 0, 0);
    }

    重设尺寸();
    window.addEventListener("resize", 重设尺寸);

    const x最小 = -9;
    const x最大 = 9;
    const y最小 = -3.2;
    const y最大 = 3.2;
    const 转x = (x) => ((x - x最小) / (x最大 - x最小)) * 宽;
    const 转y = (y) => 高 - ((y - y最小) / (y最大 - y最小)) * 高;

    // sin 在 0 处的泰勒和：偶数阶系数为 0，所以只累加奇数项
    function 泰勒(x, 阶) {
      let 和 = 0;
      let 项 = x;
      for (let k = 1; k <= 阶; k += 2) {
        和 += 项;
        项 *= (-x * x) / ((k + 1) * (k + 2));
      }
      return 和;
    }

    // 误差首次超过 1e-3 的位置（单侧）
    function 半宽(阶) {
      for (let x = 0; x < 9; x += 0.01) {
        if (Math.abs(Math.sin(x) - 泰勒(x, 阶)) > 1e-3) return x;
      }
      return 9;
    }

    function 画一帧(阶, 进度) {
      ctx.clearRect(0, 0, 宽, 高);

      ctx.strokeStyle = "#DFE6F0";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, 转y(0));
      ctx.lineTo(宽, 转y(0));
      ctx.moveTo(转x(0), 0);
      ctx.lineTo(转x(0), 高);
      ctx.stroke();

      // 准确度区间
      const 宽度 = 半宽(阶) * 进度;
      ctx.fillStyle = "rgba(14,159,110,.11)";
      ctx.fillRect(转x(-宽度), 0, 转x(宽度) - 转x(-宽度), 高);
      ctx.strokeStyle = "rgba(14,159,110,.55)";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(转x(-宽度), 0);
      ctx.lineTo(转x(-宽度), 高);
      ctx.moveTo(转x(宽度), 0);
      ctx.lineTo(转x(宽度), 高);
      ctx.stroke();
      ctx.setLineDash([]);

      // 误差填充：两条线都在视野内才填
      ctx.fillStyle = "rgba(27,79,216,.13)";
      ctx.beginPath();
      let 落笔 = false;
      for (let i = 0; i <= 400; i++) {
        const x = x最小 + ((x最大 - x最小) * i) / 400;
        const 近似 = 泰勒(x, 阶);
        if (近似 > y最大 || 近似 < y最小) continue;
        const 像素x = 转x(x);
        const 像素y = 转y(Math.sin(x));
        if (落笔) ctx.lineTo(像素x, 像素y);
        else {
          ctx.moveTo(像素x, 像素y);
          落笔 = true;
        }
      }
      for (let i = 400; i >= 0; i--) {
        const x = x最小 + ((x最大 - x最小) * i) / 400;
        const 近似 = 泰勒(x, 阶);
        if (近似 > y最大 || 近似 < y最小) continue;
        ctx.lineTo(转x(x), 转y(近似));
      }
      ctx.closePath();
      ctx.fill();

      // 原函数
      ctx.strokeStyle = "#0F1621";
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";
      ctx.beginPath();
      for (let i = 0; i <= 500; i++) {
        const x = x最小 + ((x最大 - x最小) * i) / 500;
        if (i) ctx.lineTo(转x(x), 转y(Math.sin(x)));
        else ctx.moveTo(转x(x), 转y(Math.sin(x)));
      }
      ctx.stroke();

      // 泰勒多项式
      ctx.strokeStyle = "#1B4FD8";
      ctx.lineWidth = 2.5;
      ctx.setLineDash([9, 5]);
      ctx.lineCap = "round";
      ctx.beginPath();
      let 笔 = false;
      for (let i = 0; i <= 500; i++) {
        const x = x最小 + ((x最大 - x最小) * i) / 500;
        const y = 泰勒(x, 阶);
        if (y > y最大 * 1.4 || y < y最小 * 1.4) {
          笔 = false;
          continue;
        }
        if (笔) ctx.lineTo(转x(x), 转y(y));
        else {
          ctx.moveTo(转x(x), 转y(y));
          笔 = true;
        }
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // 展开点
      ctx.fillStyle = "#1B4FD8";
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(转x(0), 转y(0), 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    if (减少动画) {
      画一帧(7, 1);
      return () => window.removeEventListener("resize", 重设尺寸);
    }

    const 阶列表 = [1, 3, 5, 7, 9, 11];
    let 序号 = 0;
    let 起点 = null;
    let 帧id;

    function 每帧(时间戳) {
      if (起点 === null) 起点 = 时间戳;
      const 已过 = 时间戳 - 起点;
      const 原始 = Math.min(1, 已过 / 700);
      // 缓入缓出，让带子张开得柔和一点
      画一帧(阶列表[序号], 原始 * 原始 * (3 - 2 * 原始));
      if (已过 > 1500) {
        起点 = 时间戳;
        序号 = (序号 + 1) % 阶列表.length;
      }
      帧id = requestAnimationFrame(每帧);
    }

    帧id = requestAnimationFrame(每帧);

    return () => {
      cancelAnimationFrame(帧id);
      window.removeEventListener("resize", 重设尺寸);
    };
  }, []);

  return (
    <canvas
      ref={画布Ref}
      style={{ display: "block", width: "100%", height: "340px" }}
    />
  );
}

// ———————— 页面 ————————

// 标题存 key，渲染时才翻 —— 这个数组在组件外，拿不到 t
const 功能列表 = [
  { 记号: "f′(x)", 标题键: "导数与切线" },
  { 记号: "∫ f dx", 标题键: "黎曼和积分" },
  { 记号: "Pₙ(x)", 标题键: "泰勒展开" },
];

function HomePage() {
  const { t } = useLanguage();

  return (
    <div style={页面}>
      <div style={内容区}>
        <header style={顶栏}>
          <div style={标志}>
            Visual<span style={{ color: "#1B4FD8" }}>Math</span>
          </div>
          <div style={副标}>2D Graphing</div>
          <div style={{ marginLeft: "auto" }}>
            <LanguageSwitch />
          </div>
        </header>

        {/* 标题拆成四段：中文是「把近似『看』成一件 / 会动的事」，
            变蓝的字夹在句子中间，英文语序对不上，只能拆开各翻各的 */}
        <h1 style={大标题}>
          {t("标题前")}
          <span style={{ color: "#1B4FD8" }}>{t("标题重点")}</span>
          {t("标题后")}
          <br />
          {t("标题次行")}
        </h1>

        <div style={舞台}>
          <演示画布 />
        </div>

        <div style={{ marginTop: "2rem" }}>
          <Link to="/2d/graph" style={按钮}>
            {t("打开 2D 图形")}
          </Link>
        </div>

        <div style={功能区}>
          {功能列表.map((项) => (
            <div key={项.记号} style={功能行}>
              <div style={记号样式}>{项.记号}</div>
              <div style={标题样式}>{t(项.标题键)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ———————— 样式 ————————

const 页面 = {
  minHeight: "100vh",
  background: "#F6F8FB",
  color: "#0F1621",
  fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
  lineHeight: 1.6,
  // 坐标纸不是装饰，是这个工具的工作台
  backgroundImage:
    "linear-gradient(#DFE6F0 1px, transparent 1px), linear-gradient(90deg, #DFE6F0 1px, transparent 1px)",
  backgroundSize: "28px 28px",
};

const 内容区 = { maxWidth: "1080px", margin: "0 auto", padding: "0 24px 80px" };

const 顶栏 = {
  padding: "32px 0",
  display: "flex",
  alignItems: "baseline",
  gap: "16px",
};

const 标志 = {
  fontWeight: 800,
  fontSize: "32px",
  letterSpacing: "-.025em",
};

const 副标 = {
  fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
  fontSize: "12px",
  color: "#5B6879",
  letterSpacing: ".08em",
};

const 大标题 = {
  fontWeight: 800,
  fontSize: "clamp(38px, 6.4vw, 72px)",
  lineHeight: 1.02,
  letterSpacing: "-.035em",
  margin: "28px 0 0",
};

const 舞台 = {
  marginTop: "2rem",
  border: "1px solid #DFE6F0",
  borderRadius: "2px",
  background: "#fff",
  boxShadow: "0 1px 0 rgba(15,22,33,.04)",
  overflow: "hidden",
};

const 按钮 = {
  display: "inline-block",
  background: "#1B4FD8",
  color: "#fff",
  padding: "13px 28px",
  borderRadius: "2px",
  textDecoration: "none",
  fontWeight: 500,
  fontSize: "16px",
};

const 功能区 = {
  marginTop: "4.5rem",
  borderTop: "1px solid #DFE6F0",
};

const 功能行 = {
  display: "flex",
  alignItems: "baseline",
  gap: "24px",
  padding: "20px 0",
  borderBottom: "1px solid #DFE6F0",
};

const 记号样式 = {
  fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
  fontSize: "15px",
  color: "#1B4FD8",
  width: "110px",
  flexShrink: 0,
};

const 标题样式 = {
  fontWeight: 600,
  fontSize: "19px",
  letterSpacing: "-.01em",
};

export default HomePage;

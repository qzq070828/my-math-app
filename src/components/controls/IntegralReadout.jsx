// 画布下方的数据条 - 黎曼和公式、当前值、真实答案、误差
// 数字优先显示精确式：上下限打过 π 的话，Δx = π/4、答案 = π/2 都是符号式，
// 旁边用小字留着小数近似做参照；认不出的值照常显示小数。
import { 解析表达式 } from "../../math/parse";
import { 求黎曼和, 求参考值, n序列 } from "../../math/integral";
import { 表达式转Tex, 精确数字Tex } from "../../math/tex";
import { 提取允许基, 精确Tex } from "../../math/exact";
import { useLanguage } from "../../i18n/LanguageContext";
import Tex from "../common/Tex";

// 端点方式的值是内部数据（左/右/中），显示时映射到文案 key
const 端点键 = { 左: "左端点", 右: "右端点", 中: "中点" };

// 按端点方式给出对应的求和式 LaTeX（AP 会考三者的区别）
function 求和Tex(端点方式) {
  if (端点方式 === "左")
    return "\\sum_{i=0}^{n-1} f(a + i\\,\\Delta x)\\,\\Delta x";
  if (端点方式 === "中")
    return "\\sum_{i=1}^{n} f\\!\\left(a + \\left(i - \\tfrac{1}{2}\\right)\\Delta x\\right)\\Delta x";
  return "\\sum_{i=1}^{n} f(a + i\\,\\Delta x)\\,\\Delta x";
}

// 求和值/参考值：认得出符号 → 符号式为主 + 小字小数；认不出 → 小数
function 和或符(v, 基, 无法计算文本) {
  if (!Number.isFinite(v)) return 无法计算文本;
  const 精 = 精确Tex(v, 基);
  if (!精) return v.toFixed(5);
  return (
    <>
      <Tex 源码={精} />
      <span className="微标"> ≈ {v.toFixed(5)}</span>
    </>
  );
}

function IntegralReadout({ 函数列表 }) {
  const { t } = useLanguage();
  const 开启的 = 函数列表.filter((项) => 项.显示积分 && 项.表达式);
  if (!开启的.length) return null;

  return (
    <div
      style={{
        display: "grid",
        gap: "1rem",
      }}
    >
      {开启的.map((项) => {
        // 半截表达式可能抛错，包一层
        let 黎曼和 = NaN;
        let 参考值 = NaN;
        try {
          const 解析结果 = 解析表达式(项.表达式);
          if (解析结果 && 解析结果.成功) {
            const n = Number.isFinite(项.当前n) && 项.当前n > 0 ? 项.当前n : 1;
            黎曼和 = 求黎曼和(
              解析结果.计算函数,
              项.积分下限,
              项.积分上限,
              n,
              项.端点方式
            );
            参考值 = 求参考值(解析结果.计算函数, 项.积分下限, 项.积分上限);
          }
        } catch {
          黎曼和 = NaN;
          参考值 = NaN;
        }

        const n = Number.isFinite(项.当前n) && 项.当前n > 0 ? 项.当前n : 1;
        const a = 项.积分下限;
        const b = 项.积分上限;
        const Δx = (b - a) / n;

        const 绝对误差 =
          Number.isFinite(黎曼和) && Number.isFinite(参考值)
            ? Math.abs(黎曼和 - 参考值)
            : NaN;
        const 相对误差 =
          Number.isFinite(绝对误差) && Math.abs(参考值) > 1e-9
            ? (绝对误差 / Math.abs(参考值)) * 100
            : NaN;

        // 走到序列末尾就算逼近完成，答案区高亮
        const 已完成 = !项.积分播放中 && n >= n序列[n序列.length - 1];
        const 式Tex = 表达式转Tex(项.表达式);

        // 精确显示总开关：表达式或上下限原文里出现过 π/e/√ 才允许出符号
        const 基 = 提取允许基(项.表达式, 项.积分下限原文, 项.积分上限原文);

        return (
          <div
            key={项.id}
            className="读数卡"
            style={{ "--卡色": 项.颜色 }}
          >
            {/* 标题：这是哪条函数的哪个积分（真排版，上下限优先符号式） */}
            <div className="读数卡头">
              <span className="色点" style={{ backgroundColor: 项.颜色 }} />
              <Tex
                源码={`\\int_{${精确数字Tex(a, 基)}}^{${精确数字Tex(b, 基)}} ${式Tex ?? "f(x)"} \\, dx`}
              />
              <span className="微标">
                {t("端点方式说明", t(端点键[项.端点方式] || "右端点"))}
              </span>
            </div>

            {/* 黎曼和的数学写法 */}
            <div className="公式带">
              <Tex 块 源码={求和Tex(项.端点方式)} />
              <Tex
                块
                源码={`\\Delta x = \\frac{b - a}{n} = \\frac{${精确数字Tex(b, 基)} - (${精确数字Tex(a, 基)})}{${n}} = ${精确数字Tex(Δx, 基, 5)}`}
              />
            </div>

            {/* 答案与误差（误差是量级概念，永远小数） */}
            <div className="答案行">
              <div>
                n = {n} → {t("黎曼和")} = {和或符(黎曼和, 基, t("无法计算"))}
              </div>

              <div
                className="答案块"
                style={{ background: 已完成 ? "#dbeafe" : "transparent" }}
              >
                {t("答案")} = {和或符(参考值, 基, t("无法计算"))}
              </div>

              <div
                className={`答案块 ${
                  Number.isFinite(相对误差) && 相对误差 < 1
                    ? "误差好"
                    : "误差大"
                }`}
              >
                {t("误差")} ={" "}
                {Number.isFinite(绝对误差) ? 绝对误差.toFixed(5) : "—"}
                {Number.isFinite(相对误差) && `（${相对误差.toFixed(2)}%）`}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default IntegralReadout;

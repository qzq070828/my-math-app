// 单个函数的积分控制 - 上下限、端点方式、逼近播放
import { useEffect } from "react";
import { n序列 } from "../../math/integral";
import { 表达式转Tex } from "../../math/tex";
import { useLanguage } from "../../i18n/LanguageContext";
import NumberInput from "./NumberInput";
import Tex from "../common/Tex";

const 每步毫秒 = 400;

function IntegralRow({ 项, 更新函数 }) {
  const { t } = useLanguage();
  const 当前n = Number.isFinite(项.当前n) && 项.当前n > 0 ? 项.当前n : 1;
  const 式Tex = 项.表达式 ? 表达式转Tex(项.表达式) : null;

  // n 的逐步逼近：每次只安排下一步，走到序列末尾自动停
  useEffect(() => {
    if (!项.积分播放中) return;

    const 位置 = n序列.indexOf(当前n);
    if (位置 === -1 || 位置 >= n序列.length - 1) {
      更新函数(项.id, "积分播放中", false);
      return;
    }

    const 定时器 = setTimeout(() => {
      更新函数(项.id, "当前n", n序列[位置 + 1]);
    }, 每步毫秒);

    return () => clearTimeout(定时器);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [项.积分播放中, 当前n]);

  function 开始逼近() {
    更新函数(项.id, "当前n", n序列[0]);
    更新函数(项.id, "积分播放中", true);
  }

  return (
    <div className="功能卡">
      {/* 用颜色点 + 表达式标明这是哪条函数 */}
      <div className="功能卡头">
        <span className="色点" style={{ backgroundColor: 项.颜色 }} />
        {式Tex ? (
          <Tex 源码={式Tex} />
        ) : (
          <span className="代码">{项.表达式 || t("空表达式")}</span>
        )}
      </div>

      <label className="复选行">
        <input
          type="checkbox"
          checked={项.显示积分}
          onChange={(事件) => 更新函数(项.id, "显示积分", 事件.target.checked)}
        />
        {t("定积分")}
      </label>

      {项.显示积分 && (
        <div
          style={{
            marginTop: "0.55rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          {/* 上下限可以打 pi、pi/2、sqrt(2) 这种常量 */}
          <div className="联排">
            <span className="微标">a =</span>
            <NumberInput
              值={项.积分下限}
              原文={项.积分下限原文}
              提交={(数, 原文) => {
                更新函数(项.id, "积分下限", 数);
                更新函数(项.id, "积分下限原文", 原文 ?? null);
              }}
              style={{ width: "4rem" }}
            />
            <span className="微标">b =</span>
            <NumberInput
              值={项.积分上限}
              原文={项.积分上限原文}
              提交={(数, 原文) => {
                更新函数(项.id, "积分上限", 数);
                更新函数(项.id, "积分上限原文", 原文 ?? null);
              }}
              style={{ width: "4rem" }}
            />
          </div>

          {/* 端点方式：AP 会考「左和是高估还是低估」 */}
          <div className="联排">
            <span className="微标">{t("矩形高取")}</span>
            <select
              className="输入框"
              value={项.端点方式}
              onChange={(事件) => 更新函数(项.id, "端点方式", 事件.target.value)}
            >
              {/* value 是内部数据，别翻；只翻显示出来的字 */}
              <option value="左">{t("左端点")}</option>
              <option value="右">{t("右端点")}</option>
              <option value="中">{t("中点")}</option>
            </select>
          </div>

          <button
            className="按钮 按钮-整宽"
            onClick={开始逼近}
            disabled={项.积分播放中}
          >
            {项.积分播放中 ? t("逼近中") : t("开始逼近")}
          </button>

          {/* 手动拖 n：拖动时停止自动播放 */}
          <input
            type="range"
            min="0"
            max={n序列.length - 1}
            step="1"
            value={Math.max(0, n序列.indexOf(当前n))}
            onChange={(事件) => {
              更新函数(项.id, "积分播放中", false);
              更新函数(项.id, "当前n", n序列[Number(事件.target.value)]);
            }}
            style={{ width: "100%" }}
          />
        </div>
      )}
    </div>
  );
}

export default IntegralRow;

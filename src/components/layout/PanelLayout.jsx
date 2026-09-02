import { useState } from "react";
import { useLanguage } from "../../i18n/LanguageContext";

function PanelLayout({ 控制区, 画布区, 底部区, 右侧区, 抽屉区, 抽屉标题 }) {
  const { t } = useLanguage();
  // 页面布局：左控制栏 + 中画布（下方带数据条） + 右功能栏
  //
  // 抽屉浮在左栏上方：看表格时不需要同时改表达式，
  // 盖住比挤开好 —— 挤开会让画布变窄，图跟着变形。
  const [抽屉展开, 设置抽屉展开] = useState(false);

  return (
    <div className="布局根">
      {/* 左侧控制面板 */}
      <aside className="侧栏">{控制区}</aside>

      {/* 抽屉：盖在左栏上方 */}
      {抽屉区 && 抽屉展开 && (
        <div className="抽屉">
          <div className="抽屉头">
            <span>{抽屉标题 || t("详细数据")}</span>
            <button
              className="删钮"
              onClick={() => 设置抽屉展开(false)}
              title={t("关闭抽屉")}
            >
              ✕
            </button>
          </div>
          {抽屉区}
        </div>
      )}

      {/* 中间主要内容区：画布 + 下方数据条 */}
      <main className="主区">
        <div className="主区上">
          {/* 抽屉开关：没有抽屉内容就不显示 */}
          {抽屉区 && !抽屉展开 && (
            <button
              className="按钮"
              onClick={() => 设置抽屉展开(true)}
              style={{ marginBottom: "0.5rem" }}
            >
              {t("展开泰勒数据")}
            </button>
          )}
          {画布区}
        </div>
        <div className="主区下">{底部区}</div>
      </main>

      {/* 右侧功能栏：没传就不渲染，不会留一条空白 */}
      {右侧区 && <aside className="侧栏 侧栏-右">{右侧区}</aside>}
    </div>
  );
}

export default PanelLayout;

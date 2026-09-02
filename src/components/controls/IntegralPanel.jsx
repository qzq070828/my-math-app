// 右侧功能面板 - 折叠式，目前内置积分功能
import { useState } from "react";
import IntegralRow from "./IntegralRow";
import { useLanguage } from "../../i18n/LanguageContext";

function IntegralPanel({ 函数列表, 更新函数 }) {
  const { t } = useLanguage();
  const [展开, 设置展开] = useState(true);

  return (
    <section className="面板">
      <button className="面板头" onClick={() => 设置展开(!展开)}>
        <span>{t("∫ 积分")}</span>
        <span className={`面板箭头${展开 ? " 开" : ""}`}>▾</span>
      </button>

      {展开 && (
        <div className="面板体">
          {函数列表.map((项) => (
            <IntegralRow key={项.id} 项={项} 更新函数={更新函数} />
          ))}
        </div>
      )}
    </section>
  );
}

export default IntegralPanel;

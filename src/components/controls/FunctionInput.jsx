// 函数输入列表 :渲染所有函数行 + 添加按钮
// 参数:
//   函数列表 : [{ id, 表达式, 颜色 }, ...]
//   更新函数 : (id, 字段, 新值) => void
//   删除函数 : (id) => void
//   添加函数 : () => void
import FunctionRow from "./FunctionRow";
import { useLanguage } from "../../i18n/LanguageContext";

function FunctionInput({ 函数列表, 更新函数, 删除函数, 添加函数 }) {
  const { t } = useLanguage();

  return (
    <div>
      <div className="区标题">{t("输入函数 y =")}</div>

      {函数列表.map((项) => (
        <FunctionRow
          key={项.id}
          项={项}
          更新函数={更新函数}
          删除函数={删除函数}
          可删除={函数列表.length > 1}
        />
      ))}

      <button className="按钮 添加按钮" onClick={添加函数}>
        {t("+ 添加函数")}
      </button>
    </div>
  );
}

export default FunctionInput;

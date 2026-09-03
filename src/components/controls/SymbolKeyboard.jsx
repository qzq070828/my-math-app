// 符号键盘 - 插入键盘上难打的数学符号
//
// 键面走 KaTeX，学生看到的是课本上的样子（√ 有横线、分数上下堆叠）；
// 插进输入框的是 ASCII，mathjs 只认后者。这两件事必须分开。
//
// 不做「智能」：点一下就插入固定文本，不猜学生想干什么。
// 唯一的贴心是光标回退 —— 点 √ 之后光标停在根号里，直接就能打 x。

import { 按分类分组 } from "../../math/symbols";
import { useLanguage } from "../../i18n/LanguageContext";
import Tex from "../common/Tex";

function SymbolKeyboard({ 插入 }) {
  const { t } = useLanguage();
  const 分组 = 按分类分组();

  return (
    <div className="符号键盘">
      {[...分组].map(([分类, 项目]) => (
        <div key={分类} className="键盘组">
          <div className="键盘组名">{t(分类)}</div>
          <div className="键盘格">
            {项目.map((项) => (
              <button
                key={项.名}
                type="button"
                className="符号键"
                title={t(项.名)}
                // 用 onMouseDown + preventDefault 而不是 onClick：
                // onClick 之前输入框已经失焦，选区信息就丢了，
                // 插入位置会跑到开头。这里阻止失焦，光标原地不动。
                onMouseDown={(事件) => {
                  事件.preventDefault();
                  插入(项.插入, 项.光标回退 ?? 0);
                }}
              >
                <Tex 源码={项.键面} />
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default SymbolKeyboard;

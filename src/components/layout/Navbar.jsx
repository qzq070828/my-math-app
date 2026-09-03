import { Link, useLocation } from "react-router-dom";
import LanguageSwitch from "./LanguageSwitch";
import { useLanguage } from "../../i18n/LanguageContext";
import { 视野重置桥 } from "../../utils/viewReset";

// 导航栏 - 品牌 + 页面链接 + 视野重置（仅 2D 页） + 语言切换
function Navbar() {
  const { t } = useLanguage();
  const { pathname } = useLocation();
  // 回到初始视野只在 2D 页有意义：别的页面没有画布可以重置
  const 在2D页 = pathname.startsWith("/2d");

  return (
    <nav className="导航">
      <Link to="/" className="品牌">
        Visual<span>Math</span>
      </Link>

      <Link to="/2d/graph" className="导航链接">
        {t("2D 图形")}
      </Link>

      {/* 通过桥对象调用画布登记的重置函数；画布没挂载时按了也没事 */}
      {在2D页 && (
        <button className="导航钮" onClick={() => 视野重置桥.重置?.()}>
          {t("回到初始视野")}
        </button>
      )}

      {/* 语言切换靠右 */}
      <div style={{ marginLeft: "auto" }}>
        <LanguageSwitch />
      </div>
    </nav>
  );
}

export default Navbar;

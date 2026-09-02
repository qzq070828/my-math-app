import { Link } from "react-router-dom";
import LanguageSwitch from "./LanguageSwitch";
import { useLanguage } from "../../i18n/LanguageContext";

// 导航栏 - 品牌 + 页面链接 + 语言切换
function Navbar() {
  const { t } = useLanguage();

  return (
    <nav className="导航">
      <Link to="/" className="品牌">
        Visual<span>Math</span>
      </Link>

      <Link to="/2d/graph" className="导航链接">
        {t("2D 图形")}
      </Link>

      {/* 语言切换靠右 */}
      <div style={{ marginLeft: "auto" }}>
        <LanguageSwitch />
      </div>
    </nav>
  );
}

export default Navbar;

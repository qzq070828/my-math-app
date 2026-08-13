import { Link } from "react-router-dom";

function Navbar() {
  // 导航栏 - 顶部菜单
  return (
    <nav style={{ display: "flex", gap: "1.5rem", padding: "1rem", borderBottom: "1px solid #ddd" }}>
      {/* 主页链接 */}
      <Link to="/">首页</Link>
      
      {/* 2D 图形模块 */}
      <Link to="/2d/graph">2D 图形</Link>
    </nav>
  );
}

export default Navbar;
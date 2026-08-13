import { Routes, Route } from "react-router-dom";
import HomePage from "../pages/HomePage";
import Graph2DPage from "../pages/Graph2DPage";

// 路由配置 - 管理所有页面的 URL 映射
function AppRoutes() {
  return (
    <Routes>
      {/* 首页 */}
      <Route path="/" element={<HomePage />} />
      
      {/* 2D 图形页面 */}
      <Route path="/2d/graph" element={<Graph2DPage />} />
    </Routes>
  );
}

export default AppRoutes;

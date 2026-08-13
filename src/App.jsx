import Navbar from "./components/layout/Navbar";
import AppRoutes from "./router/routes";

// 主应用组件 - 组织导航栏和路由
function App() {
  return (
    <>
      {/* 顶部导航栏 */}
      <Navbar />
      
      {/* 路由渲染区 */}
      <AppRoutes />
    </>
  );
}

export default App;

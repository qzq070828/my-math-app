import Navbar from "./components/layout/Navbar";
import AppRoutes from "./router/routes";
import { LanguageProvider } from "./i18n/LanguageContext";

// 主应用组件 - 组织导航栏和路由
function App() {
  return (
    <LanguageProvider>
      {/* 顶部导航栏 */}
      <Navbar />

      {/* 路由渲染区 */}
      <AppRoutes />
    </LanguageProvider>
  );
}

export default App;

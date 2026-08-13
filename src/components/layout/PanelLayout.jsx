function PanelLayout({ 控制区, 画布区, 底部区, 右侧区 }) {
  // 页面布局：左控制栏 + 中画布（下方带数据条） + 右功能栏
  return (
    <div style={{ display: "flex", height: "calc(100vh - 60px)" }}>
      {/* 左侧控制面板 */}
      <aside
        style={{
          width: "280px",
          padding: "1rem",
          borderRight: "1px solid #ddd",
          overflowY: "auto",
          flexShrink: 0,
        }}
      >
        {控制区}
      </aside>

      {/* 中间主要内容区：画布 + 下方数据条 */}
      <main style={{ flex: 1, padding: "1rem", overflow: "auto", minWidth: 0 }}>
        {画布区}
        {底部区}
      </main>

      {/* 右侧功能栏：没传就不渲染，不会留一条空白 */}
      {右侧区 && (
        <aside
          style={{
            width: "300px",
            padding: "1rem",
            borderLeft: "1px solid #ddd",
            overflowY: "auto",
            flexShrink: 0,
          }}
        >
          {右侧区}
        </aside>
      )}
    </div>
  );
}

export default PanelLayout;

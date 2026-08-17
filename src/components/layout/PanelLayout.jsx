import { useState } from "react";

function PanelLayout({ 控制区, 画布区, 底部区, 右侧区, 抽屉区, 抽屉标题 }) {
  // 页面布局：左控制栏 + 中画布（下方带数据条） + 右功能栏
  //
  // 抽屉浮在左栏上方：看表格时不需要同时改表达式，
  // 盖住比挤开好 —— 挤开会让画布变窄，图跟着变形。
  const [抽屉展开, 设置抽屉展开] = useState(false);

  return (
    <div
      style={{
        display: "flex",
        height: "calc(100vh - 60px)",
        overflow: "hidden",
        position: "relative",
      }}
    >
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

      {/* 抽屉：盖在左栏上方 */}
      {抽屉区 && 抽屉展开 && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "420px",
            height: "100%",
            background: "#fff",
            borderRight: "1px solid #ccc",
            boxShadow: "2px 0 12px rgba(0,0,0,0.12)",
            overflowY: "auto",
            zIndex: 10,
            padding: "1rem",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.75rem",
              position: "sticky",
              top: 0,
              background: "#fff",
              paddingBottom: "0.5rem",
            }}
          >
            <strong style={{ fontSize: "1.05rem" }}>
              {抽屉标题 || "详细数据"}
            </strong>
            <button
              onClick={() => 设置抽屉展开(false)}
              title="关闭，回到函数编辑"
              style={{
                width: "1.9rem",
                height: "1.9rem",
                border: "1px solid #ccc",
                borderRadius: "4px",
                background: "#fff",
                cursor: "pointer",
                fontSize: "1rem",
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>
          {抽屉区}
        </div>
      )}

      {/* 中间主要内容区：画布 + 下方数据条 */}
      <main
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "1rem 1rem 0", flexShrink: 0 }}>
          {/* 抽屉开关：没有抽屉内容就不显示 */}
          {抽屉区 && !抽屉展开 && (
            <button
              onClick={() => 设置抽屉展开(true)}
              style={{
                marginBottom: "0.5rem",
                padding: "0.35rem 0.75rem",
                border: "1px solid #999",
                borderRadius: "4px",
                background: "#fff",
                cursor: "pointer",
                fontSize: "0.85rem",
              }}
            >
              ▤ 展开泰勒数据
            </button>
          )}
          {画布区}
        </div>
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "0 1rem 1rem",
            minHeight: 0,
          }}
        >
          {底部区}
        </div>
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

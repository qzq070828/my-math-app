// 语言切换 - Language 按钮 + 下拉小栏
//
// 按钮固定写 Language（两种语言的人都认得这个词）。
// 小栏里只列「另一种」语言 —— 点开就是为了切走，
// 把当前语言也列出来是多余的一行。
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../../i18n/LanguageContext";
import { 支持语言 } from "../../i18n/strings";

function LanguageSwitch() {
  const { 语言, 设置语言 } = useLanguage();
  const [展开, 设置展开] = useState(false);
  const 容器Ref = useRef(null);

  // 点外面或按 Esc 收起 —— 不做的话菜单会一直挂着
  useEffect(() => {
    if (!展开) return;

    function 处理点击(e) {
      if (容器Ref.current && !容器Ref.current.contains(e.target)) {
        设置展开(false);
      }
    }
    function 处理按键(e) {
      if (e.key === "Escape") 设置展开(false);
    }

    document.addEventListener("mousedown", 处理点击);
    document.addEventListener("keydown", 处理按键);
    return () => {
      document.removeEventListener("mousedown", 处理点击);
      document.removeEventListener("keydown", 处理按键);
    };
  }, [展开]);

  const 其他 = 支持语言.filter((项) => 项.代码 !== 语言);

  return (
    <div ref={容器Ref} style={{ position: "relative" }}>
      <button
        onClick={() => 设置展开((v) => !v)}
        style={{
          ...触发按钮,
          borderColor: 展开 ? "#1B4FD8" : "#DFE6F0",
          color: 展开 ? "#1B4FD8" : "#5B6879",
        }}
      >
        Language
        <span style={{ ...箭头, transform: 展开 ? "rotate(180deg)" : "none" }}>
          ▾
        </span>
      </button>

      {展开 && (
        <div style={菜单}>
          {其他.map((项) => (
            <button
              key={项.代码}
              onClick={() => {
                设置语言(项.代码);
                设置展开(false);
              }}
              style={菜单项}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#F6F8FB")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
            >
              {项.名称}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ———————— 样式 ————————

const 触发按钮 = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
  fontSize: "12px",
  letterSpacing: ".08em",
  padding: "6px 12px",
  border: "1px solid #DFE6F0",
  borderRadius: "2px",
  background: "#fff",
  cursor: "pointer",
  transition: "border-color .15s, color .15s",
};

const 箭头 = {
  fontSize: "9px",
  transition: "transform .15s",
};

const 菜单 = {
  position: "absolute",
  top: "calc(100% + 4px)",
  right: 0,
  minWidth: "100%",
  border: "1px solid #DFE6F0",
  borderRadius: "2px",
  background: "#fff",
  boxShadow: "0 4px 12px rgba(15,22,33,.08)",
  overflow: "hidden",
  zIndex: 100,
};

const 菜单项 = {
  display: "block",
  width: "100%",
  fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
  fontSize: "12px",
  letterSpacing: ".08em",
  padding: "8px 12px",
  border: "none",
  background: "#fff",
  color: "#0F1621",
  textAlign: "left",
  whiteSpace: "nowrap",
  cursor: "pointer",
  transition: "background .12s",
};

export default LanguageSwitch;

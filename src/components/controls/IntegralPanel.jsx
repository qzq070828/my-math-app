// 右侧功能面板 - 折叠式，目前内置积分功能
import { useState } from "react";
import IntegralRow from "./IntegralRow";

function IntegralPanel({ 函数列表, 更新函数 }) {
  const [展开, 设置展开] = useState(true);

  return (
    <div>
      <button
        onClick={() => 设置展开(!展开)}
        style={{
          width: "100%",
          padding: "0.6rem",
          fontSize: "1rem",
          border: "1px solid #999",
          borderRadius: "6px",
          background: 展开 ? "#eef2ff" : "#fff",
          cursor: "pointer",
          marginBottom: "0.75rem",
        }}
      >
        ∫ 积分
      </button>

      {展开 &&
        函数列表.map((项) => (
          <IntegralRow key={项.id} 项={项} 更新函数={更新函数} />
        ))}
    </div>
  );
}

export default IntegralPanel;

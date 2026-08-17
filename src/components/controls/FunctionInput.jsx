// 函数输入列表 :渲染所有函数行 + 添加按钮
// 参数:
//   函数列表 : [{ id, 表达式, 颜色 }, ...]
//   更新函数 : (id, 字段, 新值) => void
//   删除函数 : (id) => void
//   添加函数 : () => void
import FunctionRow from "./FunctionRow";

function FunctionInput({ 函数列表, 更新函数, 删除函数, 添加函数 }) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <label
        style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}
      >
        输入函数 y =
      </label>

      {函数列表.map((项) => (
        <FunctionRow
          key={项.id}
          项={项}
          更新函数={更新函数}
          删除函数={删除函数}
          可删除={函数列表.length > 1}
        />
      ))}

      <button
        onClick={添加函数}
        style={{
          width: "100%",
          padding: "0.5rem",
          fontSize: "0.95rem",
          border: "1px dashed #999",
          borderRadius: "4px",
          background: "#fff",
          cursor: "pointer",
        }}
      >
        + 添加函数
      </button>
    </div>
  );
}

export default FunctionInput;

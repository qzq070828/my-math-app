import { createContext, useContext, useEffect, useState } from "react";
import { 文案 } from "./strings";

const 上下文 = createContext(null);
const 存储键 = "mathlens-语言";

export function LanguageProvider({ children }) {
  const [语言, 设置语言] = useState(() => {
    try {
      const 存的 = localStorage.getItem(存储键);
      if (存的 && 文案[存的]) return 存的;
    } catch {
      /* 无痕模式等读不了，用默认值 */
    }
    return "zh";
  });

  useEffect(() => {
    try {
      localStorage.setItem(存储键, 语言);
    } catch {
      /* 存不了就算了 */
    }
  }, [语言]);

  function t(键, ...参数) {
    const 值 = (文案[语言] && 文案[语言][键]) ?? 文案.zh[键] ?? 键;
    return typeof 值 === "function" ? 值(...参数) : 值;
  }

  return (
    <上下文.Provider value={{ 语言, 设置语言, t }}>{children}</上下文.Provider>
  );
}

export function useLanguage() {
  const 值 = useContext(上下文);
  if (!值) throw new Error("useLanguage 必须放在 LanguageProvider 里面用");
  return 值;
}

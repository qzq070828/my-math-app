// 导数读数 - 勾了「显示导数」的函数，它的导数公式列在这里
//
// 以前公式塞在左侧栏的复选框下面：侧栏只有 272px，
// 商法则、链式法则套出来的长分式永远排不下，挤成两行还截断。
// 现在挪到画布下方的通宽数据带，和积分、泰勒的数据聚在一起。
import { 解析表达式 } from "../../math/parse";
import { 取导数 } from "../../math/derivative";
import { 表达式转Tex } from "../../math/tex";
import Tex from "../common/Tex";

function DerivativeReadout({ 函数列表 }) {
  const 要显示的 = 函数列表.filter((项) => 项.显示导数 && 项.表达式);
  if (要显示的.length === 0) return null;

  return (
    <>
      {要显示的.map((项) => {
        let 导数信息 = null;
        try {
          const 解析结果 = 解析表达式(项.表达式);
          if (解析结果 && 解析结果.成功) {
            导数信息 = 取导数(项.表达式, 解析结果.计算函数, 1);
          }
        } catch {
          导数信息 = null;
        }

        // 求导失败或拿不到公式就不出这张卡
        if (!导数信息 || (!导数信息.公式Tex && !导数信息.公式)) return null;

        let 式Tex = null;
        try {
          式Tex = 表达式转Tex(项.表达式);
        } catch {
          式Tex = null;
        }

        return (
          <div key={项.id} className="读数卡" style={{ "--卡色": 项.颜色 }}>
            <div className="读数卡头">
              <span className="色点" style={{ backgroundColor: 项.颜色 }} />
              {式Tex ? (
                <Tex 源码={式Tex} />
              ) : (
                <span className="代码">{项.表达式}</span>
              )}
            </div>
            <div className="公式带">
              {导数信息.公式Tex ? (
                <Tex 块 源码={`f'(x) = ${导数信息.公式Tex}`} />
              ) : (
                <span className="代码">f′(x) = {导数信息.公式}</span>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}

export default DerivativeReadout;

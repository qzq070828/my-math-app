import { useState, useRef } from "react";
import PanelLayout from "../components/layout/PanelLayout";
import FunctionInput from "../components/controls/FunctionInput";
import Canvas2D from "../components/canvas2d/Canvas2D";
import { 可选颜色 } from "../utils/colors";
import IntegralPanel from "../components/controls/IntegralPanel";
import IntegralReadout from "../components/controls/IntegralReadout";
import TaylorPanel from "../components/controls/TaylorPanel";
import TaylorReadout from "../components/controls/TaylorReadout";


// 2D 图形页面 - 函数绘图工具
function Graph2DPage() {
  // 函数列表：每个元素是 { id, 表达式, 颜色, 显示导数 }
  const [函数列表, 设置函数列表] = useState([
    {
      id: 1,
      表达式: "sin(x)",
      颜色: 可选颜色[0],
      显示导数: false,
      显示切线: false,
      切点x: 1,
      滑块范围: 5,
      追踪函数: false,
      追踪切线: false,
      显示积分: false,
      积分下限: 0,
      积分上限: 3,
      当前n: 1,
      积分播放中: false,
      端点方式: "右",
      显示泰勒: false,
      展开点a: 0,
      泰勒阶数: 1,
      泰勒播放中: false,
      显示误差带: true,
      显示容差区间: false,
      容差: 1e-3,
      对比点x: 1,
    },
  ]);

  const 下一个id = useRef(2);

  function 添加函数() {
    const 新函数 = {
      id: 下一个id.current,
      表达式: "",
      颜色: 可选颜色[函数列表.length % 可选颜色.length],
      显示导数: false,
      显示切线: false,
      切点x: 1,
      滑块范围: 5,
      追踪函数: false,
      追踪切线: false,
      显示积分: false,
      积分下限: 0,
      积分上限: 3,
      当前n: 1,
      积分播放中: false,
      端点方式: "右",

    };
    下一个id.current += 1;
    设置函数列表([...函数列表, 新函数]);
  }

  // 修改某个函数的某个字段（"表达式" / "颜色" / "显示导数"）
  function 更新函数(id, 字段, 新值) {
    设置函数列表((旧列表) =>
      旧列表.map((项) => (项.id === id ? { ...项, [字段]: 新值 } : 项))
    );
  }

  function 删除函数(id) {
    设置函数列表((旧列表) => 旧列表.filter((项) => 项.id !== id));
  }

  return (
    <PanelLayout
      控制区={
        <FunctionInput
          函数列表={函数列表}
          更新函数={更新函数}
          删除函数={删除函数}
          添加函数={添加函数}
        />
      }
      画布区={<Canvas2D 函数列表={函数列表} />}
      底部区={<IntegralReadout 函数列表={函数列表} />}
      抽屉标题="泰勒展开数据"
      抽屉区={<TaylorReadout 函数列表={函数列表} 更新函数={更新函数} />}
      右侧区={
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <IntegralPanel 函数列表={函数列表} 更新函数={更新函数} />
          <TaylorPanel 函数列表={函数列表} 更新函数={更新函数} />
        </div>
      }

      右侧区={
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <IntegralPanel 函数列表={函数列表} 更新函数={更新函数} />
          <TaylorPanel 函数列表={函数列表} 更新函数={更新函数} />
        </div>
      }

    />
  );

}

export default Graph2DPage;

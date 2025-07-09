"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ----------------- 简易表达式解析 & AST 工具 -----------------
// 去掉空格
const norm = (s: string) => s.replace(/\s+/g, "");

// 递归解析形如 a + b 的表达式（仅支持加法示例）
function parseExpr(expr: string): any {
  expr = norm(expr);
  // 若不含括号直接返回变量名
  if (!expr.includes("+")) return expr;

  // 去最外层括号
  if (expr.startsWith("(") && expr.endsWith(")")) {
    expr = expr.slice(1, -1);
  }

  // 寻找最外层的加号（忽略括号内）
  let depth = 0;
  for (let i = 0; i < expr.length; i++) {
    if (expr[i] === "(") depth++;
    else if (expr[i] === ")") depth--;
    else if (expr[i] === "+" && depth === 0) {
      const left = expr.slice(0, i);
      const right = expr.slice(i + 1);
      return {
        op: "+",
        left: parseExpr(left),
        right: parseExpr(right),
      };
    }
  }
  return expr; // 兜底
}

// AST -> 字符串
function stringify(ast: any): string {
  if (typeof ast === "string") return ast;
  return `(${stringify(ast.left)} + ${stringify(ast.right)})`;
}

// ----------------- UI 组件 -----------------
const UIButton = ({ children, ...props }) => (
  <button
    {...props}
    className="px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
  >
    {children}
  </button>
);

const Card = ({ children }) => <div className="border rounded-xl shadow bg-white">{children}</div>;
const CardContent = ({ children, className = "" }) => <div className={`p-4 ${className}`}>{children}</div>;

// ----------------- 规则集合（基于 AST） -----------------
const rules = [
  {
    name: "结合律",
    description: "(x + y) + z ↔ x + (y + z)",
    apply: (expr: string) => {
      const ast = parseExpr(expr);
      // (x + y) + z  => x + (y + z)
      if (
        typeof ast === "object" &&
        ast.op === "+" &&
        typeof ast.left === "object" &&
        ast.left.op === "+"
      ) {
        const { left: x, right: y } = ast.left;
        const z = ast.right;
        return stringify({ op: "+", left: x, right: { op: "+", left: y, right: z } });
      }
      // x + (y + z) => (x + y) + z
      if (
        typeof ast === "object" &&
        ast.op === "+" &&
        typeof ast.right === "object" &&
        ast.right.op === "+"
      ) {
        const x = ast.left;
        const { left: y, right: z } = ast.right;
        return stringify({ op: "+", left: { op: "+", left: x, right: y }, right: z });
      }
      return expr;
    },
  },
  {
    name: "交换律",
    description: "x + y ↔ y + x",
    apply: (expr: string) => {
      const ast = parseExpr(expr);
      if (typeof ast === "object" && ast.op === "+") {
        return stringify({ op: "+", left: ast.right, right: ast.left });
      }
      return expr;
    },
  },
  {
    name: "去括号",
    description: "去掉无用括号，如 x + (y + z) → x + y + z",
    apply: (expr: string) => {
      const ast = parseExpr(expr);
      return stringify(ast).replace(/\(([^()]+)\)/g, "$1"); // 简单去外层括号
    },
  },
];

// AI 路径示例（静态）
const aiSteps = ["((x + y) + z)", "(x + (y + z))", "x + y + z"];

export default function ExpressionSimplifierGame() {
  const [expr, setExpr] = useState("((x + y) + z)");
  const [history, setHistory] = useState(["((x + y) + z)"]);
  const [aiIndex, setAiIndex] = useState(0);

  const applyRule = (rule) => {
    const newExpr = rule.apply(expr);
    if (newExpr !== expr) {
      setExpr(newExpr);
      setHistory([...history, newExpr]);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setAiIndex((i) => (i < aiSteps.length - 1 ? i + 1 : i));
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="p-6 space-y-4 max-w-xl mx-auto font-sans">
      <Card>
        <CardContent className="text-xl font-semibold">
          <AnimatePresence mode="wait">
            <motion.div
              key={expr}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3 }}
            >
              当前表达式：{expr}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {rules.map((rule, i) => (
          <UIButton key={i} onClick={() => applyRule(rule)}>
            {rule.name}
            <br className="hidden md:block" />
            <span className="text-xs">{rule.description}</span>
          </UIButton>
        ))}
      </div>

      <Card>
        <CardContent className="text-sm">
          <p className="font-bold mb-2">简化历史：</p>
          <ul className="list-disc list-inside space-y-1">
            {history.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="text-sm">
          <p className="font-bold mb-2 text-blue-700">AI 简化进度：</p>
          <ul className="list-disc list-inside text-blue-600 space-y-1">
            {aiSteps.slice(0, aiIndex + 1).map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
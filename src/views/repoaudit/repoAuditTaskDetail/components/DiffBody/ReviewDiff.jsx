import React, { useEffect, useMemo, useRef, memo } from 'react';

import { Card, Empty } from 'antd';

import {
  LINE_TYPE,
  HUNK_HEADER_RE,
  IGNORED_PREFIXES,
  COLORS,
} from '@/common/constant';

const { ADD, DEL, CTX, HUNK } = LINE_TYPE;
/**
 * 解析 unified diff（最常见形式）
 * 输出行列表：{ type: ADD|DEL|"ctx"|HUNK, oldLine, newLine, text }
 */
const parseUnifiedDiff = (diffText) => {
  if (!diffText) return [];

  const lines = diffText.split('\n');
  let oldLine = null;
  let newLine = null;

  const out = [];
  let id = 0;

  for (const line of lines) {
    // 忽略文件头信息的 diff --git ...
    if (!IGNORED_PREFIXES.some((prefix) => line.startsWith(prefix))) {
      // 使用正则表达式解析出第一行的内容（以@@开头）、提取旧文件中的起始行号（第一个数字）提取新文件中的起始行号（第二个数字）、忽略行数范围信息（如",5"这样的扩展信息）、识别并捕获hunk区域的行号定位信息
      const m = line.match(HUNK_HEADER_RE);
      if (m) {
        oldLine = Number(m[1]);
        newLine = Number(m[2]);
        out.push({
          id: id++,
          type: HUNK,
          oldLine: null,
          newLine: null,
          text: line,
        });
      } else if (oldLine === null || newLine === null) {
        out.push({
          id: id++,
          type: HUNK,
          oldLine: null,
          newLine: null,
          text: line,
        });
      } else {
        // 前缀 + / -,或者为空格
        const prefix = line[0];
        const content = line;

        if (prefix === '+') {
          out.push({
            id: id++,
            type: ADD,
            oldLine: null,
            newLine,
            text: content,
          });
          newLine += 1;
        } else if (prefix === '-') {
          out.push({
            id: id++,
            type: DEL,
            oldLine,
            newLine: null,
            text: content,
          });
          oldLine += 1;
        } else {
          // context line (including space-prefixed or empty)
          out.push({ id: id++, type: CTX, oldLine, newLine, text: content });
          oldLine += 1;
          newLine += 1;
        }
      }
    }
  }
  return out;
};

// 设置整个代码行样式，根据类型和isActive进行设置
const rowStyle = (type, isActive) => {
  const base = {
    display: 'grid',
    gridTemplateColumns: '72px 72px 1fr',
    gap: 0,
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    fontSize: 12,
    lineHeight: '20px',
  };

  let bg = 'transparent';
  if (type === ADD) bg = COLORS.ADD_BG;
  if (type === DEL) bg = COLORS.DEL_BG;
  if (type === HUNK) bg = COLORS.HUNK_BG;
  if (isActive) bg = COLORS.ACTIVE_BG; // 定位高亮（黄）

  return { ...base, background: bg };
};

// 设置单元格样式，当单元格类型为“ln”（行号）时，在基础样式上添加右对齐、灰色文字、不可选择等特殊样式
const cellStyle = (kind) => {
  const base = {
    padding: '0 8px',
    borderBottom: '1px solid #f0f0f0',
    whiteSpace: 'pre',
  };
  if (kind === 'ln') {
    return {
      ...base,
      textAlign: 'right',
      color: COLORS.LINE_NUM_TEXT,
      userSelect: 'none',
      background: COLORS.LINE_NUM_BG,
    };
  }
  return base;
};

/**
 * props:
 * - diffText: diff字符串
 * - locateLine: number | null （按 newLine 定位）
 */
const ReviewDiff = ({ diffText, locateLine }) => {
  const rows = useMemo(() => parseUnifiedDiff(diffText), [diffText]);

  // key: newLine -> ref，使用代码行映射dom元素
  const lineRefMap = useRef(new Map());

  if (!diffText) return <Empty description="暂无 diff 内容" />;

  return (
    <Card size="small" type="inner" title="Diff（按行号 / +/- 高亮）">
      <div style={{ border: '1px solid #f0f0f0', borderRadius: 6 }}>
        {rows.map((r, idx) => {
          const isActive = locateLine != null && r.newLine === locateLine;
          // 将 newLine 行挂 ref，用于定位滚动
          const setRef = (node) => {
            if (node && r.newLine != null)
              lineRefMap.current.set(r.newLine, node);
          };

          return (
            <div
              key={`${r.id}-${r.type}-${r.oldLine ?? ''}-${r.newLine ?? ''}`}
              style={rowStyle(r.type, isActive)}
              ref={setRef}
            >
              <div style={cellStyle('ln')}>{r.oldLine ?? ''}</div>
              <div style={cellStyle('ln')}>{r.newLine ?? ''}</div>
              <div style={cellStyle('code')}>{r.text}</div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default memo(ReviewDiff);

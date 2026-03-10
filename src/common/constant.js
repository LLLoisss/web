// Diff 行类型
export const LINE_TYPE = {
  ADD: 'add',
  DEL: 'del',
  CTX: 'ctx',
  HUNK: 'hunk',
};

// 解析形如 @@ -30,4 +30,5 @@ 的 Hunk 头部
export const HUNK_HEADER_RE = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/;

// diff 文件头信息前缀，解析时跳过这些行
export const IGNORED_PREFIXES = [
  'diff --git',
  'index ',
  '--- a/',
  '+++ b/',
  'new file mode',
  'deleted file mode',
  'old mode',
  'new mode',
  'similarity index',
  'rename from',
  'rename to',
  'Binary files',
];

// Diff 行着色
export const COLORS = {
  ADD_BG: '#e6ffed',
  DEL_BG: '#ffeef0',
  HUNK_BG: '#f1f8ff',
  ACTIVE_BG: '#fffbdd',
  LINE_NUM_BG: '#fafbfc',
  LINE_NUM_TEXT: '#6a737d',
};

// 问题等级
export const ISSUE_LEVELS = {
  HIGH: 'CRITICAL',
  MEDIUM: 'MAJOR',
  LOW: 'MINOR',
};

// 问题处理状态
export const ORDER_STATUS = {
  PENDING: 0,
  ACCEPTED: 1,
  IGNORED: 2,
};

// 文件审查状态
export const FILE_STATUS = {
  REVIEWING: 0,    // 审查中
  DONE: 1,         // 审查完成
  FAILED: 2,       // 审查失败
  UNSUPPORTED: 3,  // 不支持审查
};

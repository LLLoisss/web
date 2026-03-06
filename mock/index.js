const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3001;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// --- 引入 mock 数据（CommonJS 兼容处理）---
// 由于 mock 数据文件使用 ES Module export，这里直接在 Node 中内联实现
// 以避免 ESM / CJS 混用问题

/** 模拟获取 MR 概览 */
function mockFetchReviewSummary(mergeId) {
  return {
    code: 200,
    message: '查询审查结果总览成功',
    data: {
      mergeId: mergeId || 'abc12345',
      title: 'fix: handle null pointer in parser',
      mergeTime: '2025-08-15 10:28:14',
      author: 'alice',
      sourceBranch: 'feature/fix-parser',
      targetBranch: 'main',
      status: 1,
      fileList: [
        {
          filePath: 'src/parser/index.ts',
          crId: 'CR_PARSER_001',
          fileStatus: 1,
          highProblemNum: 2,
          midProblemNum: 1,
          lowProblemNum: 1,
        },
        {
          filePath: 'src/utils/date.ts',
          crId: 'CR_DATE_002',
          fileStatus: 1,
          highProblemNum: 2,
          midProblemNum: 3,
          lowProblemNum: 1,
        },
        { filePath: 'test.md', crId: '', fileStatus: 0 },
        { filePath: 'README.md', crId: 'CR_README_003', fileStatus: 2 },
      ],
    },
  };
}

/** 模拟获取文件详情 */
function mockFetchFileDetail(crId) {
  let diffContent = '';
  let problems = [];
  if (crId === 'CR_PARSER_001') {
    diffContent = `diff --git a/src/parser/index.ts b/src/parser/index.ts
index fc66..7c63 100644
--- a/src/parser/index.ts
+++ b/src/parser/index.ts
@@ -30,4 +30,5 @@ export function parse(input: string) {
-  const len = input.length
+  const len = input?.length ?? 0
+  if (len === 0) return null
   return doParse(input, len)
 }`;
    problems = [
      {
        id: 101,
        crId,
        order: 1,
        status: 0,
        issueDetail:
          '建议在函数入口明确校验 input 并抛错或返回可控值\n\n**风险等级**: CRITICAL',
        issueLevel: 'CRITICAL',
        issueType: 'hooks 啦啦啦',
      },
      {
        id: 102,
        crId,
        order: 2,
        status: 0,
        issueDetail: 'normalize 参数 any 不利于类型收敛\n\n**风险等级**: MINOR',
        issueLevel: 'MINOR',
        issueType: 'hooks 未正常调用问题',
      },
    ];
  } else {
    diffContent = `diff --git a/file b/file\nindex 000..111 100644\n--- a/file\n+++ b/file\n@@ -1,1 +1,1 @@\n- old\n+ new content`;
    problems = [];
  }
  return {
    code: 200,
    message: '查询审查结果详情成功',
    data: {
      crId,
      mergeId: 'abc12345',
      filePath: 'src/parser/index.ts',
      diff: diffContent,
      problemList: problems,
    },
  };
}

/** 模拟提交反馈 */
function mockSubmitFeedback({ crId, order, status }) {
  return {
    code: 200,
    message: '更新评审问题反馈记录成功',
    data: { crId, order, status },
  };
}

// --- 路由 ---
app.post('/api/coding/getMergeOverview', (req, res) => {
  const { mergeId } = req.body;
  res.json(mockFetchReviewSummary(mergeId));
});

app.post('/api/coding/getMergeDetail', (req, res) => {
  const { crId } = req.body;
  res.json(mockFetchFileDetail(crId));
});

app.post('/api/coding/updateFeedback', (req, res) => {
  const { crId, order, status } = req.body;
  res.json(mockSubmitFeedback({ crId, order, status }));
});

app.listen(PORT, () => {
  console.log(`[Mock] Server running at http://localhost:${PORT}`);
});

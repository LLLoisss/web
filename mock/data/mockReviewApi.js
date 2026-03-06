// src/api/mockReviewApi.js

// 1. 获取 MR 详情和文件列表（轻量级）
export function mockFetchReviewSummaryApi(mergeId) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        code: 200,
        message: '查询审查结果总览成功',
        data: {
          mergeId: mergeId || 'abc12345',
          title: 'fix: handle null pointer in parser',
          mergeTime: '2025-08-15 10:28:14',
          author: 'alice',
          sourceBranch: 'feature/fix-parser',
          targetBranch: 'main',
          status: 1, // 1-OPEN
          // 扁平的文件列表
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
      });
    }, 500);
  });
}

// 2. 获取单个文件的 Diff 和 审查结果（重量级）
export function mockFetchFileDetailApi(crId) {
  return new Promise((resolve) => {
    setTimeout(() => {
      // 模拟不同文件的返回
      let diffContent = '';
      let problems = [];
      console.log('crId:', crId);

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
            crId: crId,
            order: 1,
            status: 0, // 0-未处理
            issueDetail:
              '建议在函数入口明确校验 input 并抛错或返回可控值\n\n**风险等级**: CRITICAL',
          issueLevel: 'CRITICAL',
            issueType: 'hooks 啊啊啊',
          },
          {
            id: 102,
            crId: crId,
            order: 2,
            status: 0,
            issueDetail:
              'normalize 参数 any 不利于类型收敛\n\n**风险等级**: MINOR',
            issueLevel: 'MINOR',
            issueType: 'hooks 未正常调用问题',
          },
        ];
      } else {
        diffContent = `diff --git a/file b/file\nindex 000..111 100644\n--- a/file\n+++ b/file\n@@ -1,1 +1,1 @@\n- old\n+ new content`;
        problems = [];
      }

      resolve({
        code: 200,
        message: '查询审查结果详情成功',
        data: {
          crId: crId,
          mergeId: 'abc12345',
          filePath: 'src/parser/index.ts', // 这里简单起见，mock 数据就不动态匹配 filePath 了
          diff: diffContent,
          problemList: problems,
        },
      });
    }, 600);
  });
}

// 3. 提交反馈
export function mockSubmitFeedbackApi(params) {
  const { crId, order, status } = params;
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        code: 200,
        message: '更新评审问题反馈记录成功',
        data: {
          crId: crId,
          order: order,
          status: status, // 1-采纳, 2-忽略
        },
      });
    }, 300);
  });
}

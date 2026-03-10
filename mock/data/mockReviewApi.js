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
              id: 'FILE_001',
              filePath: 'src/parser/index.ts',
              crId: 'CR_PARSER_001',
              fileStatus: 1,
              highProblemNum: 2,
              midProblemNum: 1,
              lowProblemNum: 1,
            },
            {
              id: 'FILE_002',
              filePath: 'src/utils/date.ts',
              crId: 'CR_DATE_002',
              fileStatus: 1,
              highProblemNum: 2,
              midProblemNum: 3,
              lowProblemNum: 1,
            },
            { id: 'FILE_003', filePath: 'test.md', crId: '', fileStatus: 0 },
            { id: 'FILE_004', filePath: 'README.md', crId: 'CR_README_003', fileStatus: 2 },
            { id: 'FILE_005', filePath: 'assets/logo.png', crId: '', fileStatus: 3 },
          ],
        },
      });
    }, 500);
  });
}

// 2. 获取单个文件的 Diff 和 审查结果（重量级）
export function mockFetchFileDetailApi(id) {
  return new Promise((resolve) => {
    setTimeout(() => {
      // 模拟不同文件的返回
      let diffContent = '';
      let problems = [];
      let crId = '';
      console.log('id:', id);

      if (id === 'FILE_001') {
        crId = 'CR_PARSER_001';
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
      } else if (id === 'FILE_002') {
        crId = 'CR_DATE_002';
        diffContent = `diff --git a/src/utils/date.ts b/src/utils/date.ts
index aa11..bb22 100644
--- a/src/utils/date.ts
+++ b/src/utils/date.ts
@@ -10,3 +10,4 @@ export function formatDate(d: Date) {
-  return d.toISOString()
+  if (!d) return ''
+  return d.toISOString()
   }`;
        problems = [
          {
            id: 201,
            crId: crId,
            order: 1,
            status: 0,
            issueDetail:
              '日期格式化函数缺少时区处理\n\n**风险等级**: CRITICAL',
            issueLevel: 'CRITICAL',
            issueType: '逻辑缺陷',
          },
          {
            id: 202,
            crId: crId,
            order: 2,
            status: 0,
            issueDetail:
              '建议使用 dayjs 替代原生 Date 方法以增强兼容性\n\n**风险等级**: CRITICAL',
            issueLevel: 'CRITICAL',
            issueType: '可维护性',
          },
          {
            id: 203,
            crId: crId,
            order: 3,
            status: 0,
            issueDetail:
              '缺少对无效日期的边界检查\n\n**风险等级**: MINOR',
            issueLevel: 'MINOR',
            issueType: '健壮性',
          },
          {
            id: 204,
            crId: crId,
            order: 4,
            status: 0,
            issueDetail:
              'formatDate 返回值类型应明确标注\n\n**风险等级**: MINOR',
            issueLevel: 'MINOR',
            issueType: '类型安全',
          },
          {
            id: 205,
            crId: crId,
            order: 5,
            status: 0,
            issueDetail:
              '函数未导出 JSDoc 注释\n\n**风险等级**: LOW',
            issueLevel: 'LOW',
            issueType: '文档规范',
          },
          {
            id: 206,
            crId: crId,
            order: 6,
            status: 0,
            issueDetail:
              '缺少单元测试覆盖\n\n**风险等级**: LOW',
            issueLevel: 'LOW',
            issueType: '测试覆盖',
          },
        ];
      } else if (id === 'FILE_004') {
        crId = 'CR_README_003';
        diffContent = `diff --git a/README.md b/README.md
index cc33..dd44 100644
--- a/README.md
+++ b/README.md
@@ -1,3 +1,4 @@
 # Project
-  Old description
+  Updated description
+  Added contribution guide`;
        problems = [];
      } else {
        crId = '';
        diffContent = `diff --git a/file b/file\nindex 000..111 100644\n--- a/file\n+++ b/file\n@@ -1,1 +1,1 @@\n- old\n+ new content`;
        problems = [];
      }

      resolve({
        code: 200,
        message: '查询审查结果详情成功',
        data: {
          crId: crId || null,
          mergeId: 'abc12345',
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

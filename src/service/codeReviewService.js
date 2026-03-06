import {
  mockFetchReviewSummaryApi,
  mockFetchFileDetailApi,
  mockSubmitFeedbackApi,
} from '../../mock/data/mockReviewApi';

import request from './reviewRequest';

class CodeReviewService {
  // 1. 获取概览
  async fetchReviewSummary(mergeId) {
    const res = await mockFetchReviewSummaryApi(mergeId);
    // const res = await request.post(`/api/coding/getMergeOverview`, { mergeId });
    console.log('获取概览res.data :>> ', res.data);
    return res.data;
  }

  // 2. 获取文件详情
  async fetchFileDetail({ crId, filePath }) {
    const res = await mockFetchFileDetailApi(crId);
    // const res = await request.post(`/api/coding/getMergeDetail`, { crId });
    // 解码 diff 字段
    if (res.data.data && res.data.data.diff) {
      try {
        res.data.data.diff = JSON.parse(res.data.data.diff);
      } catch (error) {
        console.error('Failed to parse diff:', error);
      }
    }
    // 将 filePath 透传回去，确保状态一致性
    return { ...res.data, filePath };
  }

  // 3. 提交反馈
  async submitFeedback({ crId, order, status }) {
    const res = await mockSubmitFeedbackApi({ crId, order, status });
    // const res = await request.post(`/api/coding/updateFeedback`, {
    //   crId,
    //   order,
    //   status,
    // });
    return res.data;
  }

  // TODO:4. 前端埋点：查看记录
  async reviewItemRecord(id) {
    const res = await request.post(`/api/coding/record`, { id });
    return res;
  }
}

export default new CodeReviewService();

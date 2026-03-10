// action/review.js
import codeReviewService from '@/service/codeReviewService';

// --- Action Types ---
const FETCH_SUMMARY_REQUEST = 'FETCH_SUMMARY_REQUEST';
const FETCH_SUMMARY_SUCCESS = 'FETCH_SUMMARY_SUCCESS';
const FETCH_SUMMARY_FAILURE = 'FETCH_SUMMARY_FAILURE';

const FETCH_DETAIL_REQUEST = 'FETCH_DETAIL_REQUEST';
const FETCH_DETAIL_SUCCESS = 'FETCH_DETAIL_SUCCESS';
const FETCH_DETAIL_FAILURE = 'FETCH_DETAIL_FAILURE';

const SUBMIT_FEEDBACK_SUCCESS = 'SUBMIT_FEEDBACK_SUCCESS';

const LOCATE_TO_LINE = 'LOCATE_TO_LINE';
const CLEAR_DETAIL = 'CLEAR_DETAIL';

// 设置当前选中文件路径
const SET_CURRENT_FILE_PATH = 'SET_CURRENT_FILE_PATH';
// 设置当前选中文件状态
const SET_CURRENT_FILE_STATUS = 'SET_CURRENT_FILE_STATUS';

// --- 重置缓存、清除文件缓存 ---
const CLEAR_FILE_CACHE = 'CLEAR_FILE_CACHE';
const RESET_ALL_CACHE = 'RESET_ALL_CACHE';

// 标记审查结果为已查看
const ADD_SEEN_RESULT = 'ADD_SEEN_RESULT';

// --- Action Creators (Thunks & Sync) ---

// 1. 获取概览
const fetchReviewSummary = (mergeId) => (dispatch) => {
  dispatch({
    type: FETCH_SUMMARY_REQUEST,
  });

  codeReviewService
    .fetchReviewSummary(mergeId)
    .then((res) => {
      dispatch({
        type: FETCH_SUMMARY_SUCCESS,
        payload: res,
      });
      console.log('获取概览 :>> ', res);
    })
    .catch(() => {
      dispatch({
        type: FETCH_SUMMARY_FAILURE,
      });
    });
};

// 2. 获取文件详情
const fetchFileDetail =
  ({ crId, mergeId, filePath, fileStatus }) =>
  (dispatch, getState) => {
    console.log('fetchFileDetailcrIdcrIdcrId :>> ', crId);
    console.log('fetchFileDetailfilePathfilePathfilePath :>> ', filePath);
    // TODO：查询当前文件记录表，如果已存在，则从文件记录表中找
    // 检查当前缓存中是否已经有该文件的记录
    const state = getState().review;
    const cacheData = state.fileDetailsCache[crId];

    // 手动触发 pending 状态，并传递参数以便记录当前选中的ID
    dispatch({
      type: FETCH_DETAIL_REQUEST,
      payload: { crId, filePath, fileStatus },
    });

    // 如果有缓存，直接分发Success并附带缓存数据
    if (cacheData) {
      dispatch({
        type: FETCH_DETAIL_SUCCESS,
        payload: { ...cacheData, filePath, crId, fromCache: true },
      });
      return; // 命中缓存，终止后续请求
    }

    // 如果没有缓存，则发起网络请求
    codeReviewService
      .fetchFileDetail({ crId, mergeId, filePath })
      .then((res) => {
        // 将 filePath 透传回去
        dispatch({
          type: FETCH_DETAIL_SUCCESS,
          payload: { ...res, filePath, crId, fromCache: false },
        });
      })
      .catch(() => {
        dispatch({
          type: FETCH_DETAIL_FAILURE,
        });
      });
  };

// 3. 提交反馈 (乐观更新)
const submitFeedback =
  ({ crId, order, status }) =>
  (dispatch) => {
    codeReviewService.submitFeedback({ crId, order, status }).then(() => {
      dispatch({
        type: SUBMIT_FEEDBACK_SUCCESS,
        payload: { crId, order, status },
      });
    });
  };

// 仅用于设置高亮行
const locateToLine = (line) => ({
  type: LOCATE_TO_LINE,
  payload: line,
});

// 清除详情
const clearDetail = () => ({
  type: CLEAR_DETAIL,
});

// 设置当前文件路径
const setCurrentFilePath = (filePath) => ({
  type: SET_CURRENT_FILE_PATH,
  payload: filePath,
});

// 设置当前文件状态
const setCurrentFileStatus = (fileStatus) => ({
  type: SET_CURRENT_FILE_STATUS,
  payload: fileStatus,
});

// 1. 清除特定文件的缓存
const clearFileCache = (crId) => ({
  type: CLEAR_FILE_CACHE,
  payload: crId,
});

// 2. 重置全部缓存 (通常在离开 Code Review 页面，或切换到另一个 MR 时调用)
const resetAllCache = () => ({
  type: RESET_ALL_CACHE,
});

// 标记某个审查结果为已查看
const addSeenResult = (resultId) => ({
  type: ADD_SEEN_RESULT,
  payload: resultId,
});

// --- Action Handlers (Reducer Logic) ---
const ACTION_HANDLERS = {
  // --- Summary ---
  [FETCH_SUMMARY_REQUEST]: (state) => ({
    ...state,
    loadingSummary: true,
    mrInfo: null,
    fileList: [],
  }),
  [FETCH_SUMMARY_SUCCESS]: (state, { payload }) => {
    const { fileList, ...info } = payload;
    console.log('payload：：：：', payload);
    return {
      ...state,
      loadingSummary: false,
      mrInfo: info,
      fileList: fileList || [],
    };
  },
  [FETCH_SUMMARY_FAILURE]: (state) => ({
    ...state,
    loadingSummary: false,
  }),

  // --- Detail ---
  [FETCH_DETAIL_REQUEST]: (state, { payload }) => ({
    ...state,
    loadingDetail: true,
    detailLoadError: false,
    // 记录当前选中的ID
    currentFileCrId: payload.crId,
    currentFilePath: payload.filePath,
    currentFileStatus: payload.fileStatus,
    locateLine: null,
  }),
  // [FETCH_DETAIL_SUCCESS]: (state, { payload }) => ({
  //   ...state,
  //   loadingDetail: false,
  //   currentFileDiff: payload.diff,
  //   currentFileProblems: payload.problemList || [],
  // }),
  [FETCH_DETAIL_SUCCESS]: (state, { payload }) => {
    console.log('FETCH_DETAIL_SUCCESSpayload :>> ', payload);
    const { diff, problemList, crId, fromCache } = payload;
    // 防止过期请求的响应覆盖当前状态
    if (crId !== state.currentFileCrId) {
      return state;
    }
    const nextState = {
      ...state,
      loadingDetail: false,
      currentFileDiff: diff || '',
      currentFileProblems: problemList || [],
    };
    // 如果数据不是来自缓存，我们需要将其存入缓存字典
    if (!fromCache) {
      nextState.fileDetailsCache = {
        ...state.fileDetailsCache,
        [crId]: {
          diff: diff || '',
          problemList: problemList || [],
        },
      };
    }
    return nextState;
  },
  [FETCH_DETAIL_FAILURE]: (state) => ({
    ...state,
    loadingDetail: false,
    detailLoadError: true,
    currentFileDiff: '',
    currentFileProblems: [],
    // 重置 currentFilePath，使文件树不再高亮失败的文件
    // 配合 detailLoadError 防止 useEffect 死循环重试
    currentFilePath: null,
    currentFileCrId: null,
    currentFileStatus: null,
  }),

  // --- Feedback ---
  // [SUBMIT_FEEDBACK_SUCCESS]: (state, { payload }) => {
  //   const { crId, order, status } = payload;
  //   // 如果反馈的是当前文件的问题，更新状态
  //   if (state.currentFileCrId === crId) {
  //     // 传统 Redux 需要手动处理不可变更新 (Immutable update)
  //     const newProblems = state.currentFileProblems.map((p) =>
  //       p.order === order ? { ...p, status } : p
  //     );
  //     return {
  //       ...state,
  //       currentFileProblems: newProblems,
  //     };
  //   }
  //   return state;
  // },
  [SUBMIT_FEEDBACK_SUCCESS]: (state, { payload }) => {
    const { crId, order, status } = payload;
    const nextState = { ...state };
    // 1. 如果反馈的是当前正在查看的文件，更新当前视图
    if (state.currentFileCrId === crId) {
      nextState.currentFileProblems = state.currentFileProblems.map((p) =>
        p.order === order ? { ...p, status } : p,
      );
    }
    // 2. 核心：同步更新缓存中的问题状态！
    // 这样当用户离开该文件再回来时，从缓存读取的状态才是最新的
    if (state.fileDetailsCache[crId]) {
      const cachedFile = state.fileDetailsCache[crId];
      nextState.fileDetailsCache = {
        ...state.fileDetailsCache,
        [crId]: {
          ...cachedFile,
          problemList: cachedFile.problemList.map((p) =>
            p.order === order ? { ...p, status } : p,
          ),
        },
      };
    }
    return nextState;
  },
  // 处理设置当前文件路径
  [SET_CURRENT_FILE_PATH]: (state, { payload }) => ({
    ...state,
    currentFilePath: payload,
  }),
  // 处理设置当前文件状态
  [SET_CURRENT_FILE_STATUS]: (state, { payload }) => ({
    ...state,
    currentFileStatus: payload,
  }),

  // --- 缓存管理 ---
  [CLEAR_FILE_CACHE]: (state, { payload: crId }) => {
    // 浅拷贝现有的缓存对象
    const nextCache = { ...state.fileDetailsCache };
    // 删除指定的缓存记录
    delete nextCache[crId];

    return {
      ...state,
      fileDetailsCache: nextCache,
    };
  },

  [RESET_ALL_CACHE]: (state) => ({
    ...state,
    // 清空缓存字典
    fileDetailsCache: {},
    // 同时清空当前高亮和详情状态，避免切换 MR 时看到上一个 MR 的残影
    currentFileCrId: null,
    currentFilePath: null,
    currentFileStatus: null,
    currentFileDiff: '',
    currentFileProblems: [],
    loadingDetail: false,
    detailLoadError: false,
    locateLine: null,
  }),

  // --- 已查看标记 ---
  [ADD_SEEN_RESULT]: (state, { payload }) => {
    if (state.seenResults.includes(payload)) return state;
    return { ...state, seenResults: [...state.seenResults, payload] };
  },

  // --- Sync Actions ---
  [LOCATE_TO_LINE]: (state, { payload }) => ({
    ...state,
    locateLine: payload,
  }),
  [CLEAR_DETAIL]: (state) => ({
    ...state,
    loadingDetail: false,
    currentFileCrId: null,
    currentFileStatus: null,
    currentFileDiff: '',
    currentFileProblems: [],
    locateLine: null,
  }),
};

export {
  fetchReviewSummary,
  fetchFileDetail,
  submitFeedback,
  locateToLine,
  clearDetail,
  setCurrentFilePath,
  setCurrentFileStatus,
  clearFileCache,
  resetAllCache,
  addSeenResult,
  ACTION_HANDLERS,
};

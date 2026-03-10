export default {
  userData: {
    isLoginSuccess: false,
    userName: '',
  },
  counter: {
    loading: false,
    count: 0,
  },
  test: {
    testState: '',
    testState2: '',
  },
  review: {
    // MR 概览信息
    mrInfo: null, // { title, author, ... }
    fileList: [], // [ { id, filePath, crId, fileStatus } ]
    loadingSummary: false,

    // 文件详情缓存 格式：{[crId]:{diff, problemList}}
    fileDetailsCache: {},

    // 当前选中文件的详情
    currentFileId: null,
    currentFileCrId: null,
    currentFilePath: null,
    currentFileStatus: null,
    currentFileDiff: '',
    currentFileProblems: [],
    loadingDetail: false,
    detailLoadError: false,

    // 用于 Diff 定位
    locateLine: null,

    // 已查看的审查结果 ID 集合（仅在刷新页面时重置）
    seenResults: [],
  },
};

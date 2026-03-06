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
    fileList: [], // [ { filePath, crId,status } ]
    loadingSummary: false,

    // 文件详情缓存 格式：{[crId]:{diff, problemList}}
    fileDetailsCache: {},

    // 当前选中文件的详情
    currentFileCrId: null,
    currentFilePath: null,
    currentFileStatus: null,
    currentFileDiff: '',
    currentFileProblems: [],
    loadingDetail: false,
    detailLoadError: false,

    // 用于 Diff 定位
    locateLine: null,
  },
};

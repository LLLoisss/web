import React, {
  useEffect,
  useMemo,
  memo,
  useState,
  useCallback,
  useRef,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';

import {
  FileTextOutlined,
  SyncOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Badge,
  Card,
  Col,
  Descriptions,
  Empty,
  Layout,
  List,
  Row,
  Skeleton,
  Space,
  Tag,
  Tooltip,
  Tree,
  Typography,
  Tabs,
  Button,
} from 'antd';

import {
  fetchReviewSummary,
  fetchFileDetail,
  submitFeedback,
  clearDetail,
  setCurrentFilePath,
  setCurrentFileStatus,
  resetAllCache,
} from '@/redux/actions/review';

import { FILE_STATUS } from '@/common/constant';

import DiffBody from './components/DiffBody';
import FileTreeBody from './components/FileTreeBody';
import MyCardContent from './components/MyCardContent';
import ResultsBody from './components/ResultsBody';
import DetailHead from './detailHead';

import styles from './index.less';

const { Content } = Layout;
const { Text } = Typography;
const { TabPane } = Tabs;
// 根据文件路径从数据中查找并返回对应的文件对象
// --- 辅助函数：构建目录树 ---
// 这里的关键是：树的叶子节点必须保存 crId，以便点击时发起请求
// const buildTreeData = (flatFileList) => {
//   const root = { key: "root", title: "Root", children: [] };

//   const ensureChild = (node, name) => {
//     if (!node.children) node.children = [];
//     let child = node.children.find((c) => c.title === name);
//     if (!child) {
//       child = { key: `${node.key}/${name}`, title: name, children: [] };
//       node.children.push(child);
//     }
//     return child;
//   };

//   flatFileList.forEach((file) => {
//     const parts = file.filePath.split("/");
//     let current = root;
//     parts.forEach((part, idx) => {
//       // 如果是最后一部分，说明是文件（叶子节点）
//       if (idx === parts.length - 1) {
//         if (!current.children) current.children = [];
//         current.children.push({
//           key: file.filePath, // 使用 filePath 作为 key
//           title: part,
//           isLeaf: true,
//           icon: <span style={{ fontSize: 14 }}>📄</span>,
//           // 携带额外数据，方便点击时取用
//           data: file,
//         });
//       } else {
//         current = ensureChild(current, part);
//       }
//     });
//   });

//   return root.children;
// };
const renderLeafTitle = (fileName, file) => {
  // TODO:确认高中低问题数量
  const reviewStatus = file.fileStatus;
  const stats = {
    high: file.highProblemNum,
    medium: file.midProblemNum,
    low: file.lowProblemNum,
  };
  if (reviewStatus === FILE_STATUS.REVIEWING) {
    return (
      <Space size={6}>
        <span>{fileName}</span>
        <Tag color="blue" icon={<SyncOutlined spin />}>
          审查中
        </Tag>
      </Space>
    );
  }
  if (reviewStatus === FILE_STATUS.FAILED) {
    return (
      <Space size={6}>
        <span>{fileName}</span>
        <Tag color="red" icon={<ExclamationCircleOutlined />}>
          审查失败
        </Tag>
      </Space>
    );
  }

  return (
    <Space size={6}>
      <span>{fileName}</span>
      <Badge count={stats.high} size="small" />
      <Badge count={stats.medium} size="small" color="#faad14" />
      <Badge count={stats.low} size="small" color="#52c41a" />
    </Space>
  );
};
const buildTreeData = (flatFileList) => {
  const root = { key: 'root', title: 'Root', children: [] };

  const ensureChild = (node, name) => {
    if (!node.children) node.children = [];
    let child = node.children.find((c) => c.title === name);
    if (!child) {
      child = { key: `${node.key}/${name}`, title: name, children: [] };
      node.children.push(child);
    }
    return child;
  };

  // 1. 先构建完整的原始树结构
  flatFileList.forEach((file) => {
    const parts = file.filePath.split('/');
    let current = root;
    parts.forEach((part, idx) => {
      if (idx === parts.length - 1) {
        if (!current.children) current.children = [];
        current.children.push({
          key: file.filePath,
          titleRaw: part,
          title: renderLeafTitle(part, file),
          isLeaf: true,
          icon: <FileTextOutlined />,
          data: file,
          // TODO:确认状态
          fileStatus: file.fileStatus,
        });
      } else {
        current = ensureChild(current, part);
      }
    });
  });

  // 2. 新增：递归压缩只有一个子节点的文件夹
  const compress = (nodes) =>
    nodes.map((node) => {
      // 如果不是叶子节点且只有一个子节点，且该子节点也不是叶子节点
      while (
        node.children &&
        node.children.length === 1 &&
        !node.children[0].isLeaf
      ) {
        const onlyChild = node.children[0];
        // 合并标题和 Key
        node.title = `${node.title}/${onlyChild.title}`;
        node.key = onlyChild.key;
        node.children = onlyChild.children;
      }

      // 继续递归处理子节点
      if (node.children && node.children.length > 0) {
        node.children = compress(node.children);
      }
      return node;
    });

  // 返回压缩后的根子节点
  console.log('flatFileList :>> ', flatFileList);
  console.log('compress(root.children) :>> ', compress(root.children));
  return compress(root.children);
};
const CodeReviewPage = () => {
  // 获取location对象, 解析查询参数
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const reviewId = queryParams.get('id'); // 直接获取id
  const [activeTab, setActiveTab] = useState('AI');
  const dispatch = useDispatch();
  const codingJwt = queryParams.get('data'); // 直接获取id
  // 获取store中review的状态和方法
  const {
    mrInfo,
    fileList,
    loadingSummary,
    currentFileCrId,
    currentFilePath,
    currentFileStatus,
    currentFileDiff,
    currentFileProblems,
    loadingDetail,
    locateLine,
    detailLoadError,
  } = useSelector((state) => state.review);

  // 页面加载完成后开始向后端发请求获取 MR 概览
  useEffect(() => {
    setActiveTab('AI');
    if (reviewId) dispatch(fetchReviewSummary(reviewId));
    // cleanUp函数：当组件卸载时，mergeId发生变化，准备下一次effect前，清空缓存
    return () => {
      dispatch(resetAllCache());
    };
  }, [reviewId, dispatch]);

  // 当文件列表加载完毕，且当前没有选中文件时，触发第一个文件的加载
  useEffect(() => {
    // detailLoadError 为 true 表示上次请求失败，不自动重试，防止死循环
    if (fileList.length > 0 && !currentFilePath && !detailLoadError) {
      // 加载第一个 crId 不为空且审查完成的文件
      const firstFile = fileList.find(
        (file) =>
          file.crId !== null &&
          file.crId !== undefined &&
          file.crId !== '' &&
          file.fileStatus === FILE_STATUS.DONE,
      );
      // 如果第一个文件的crId不为空，则正常请求
      if (firstFile) {
        dispatch(
          fetchFileDetail({
            crId: firstFile.crId,
            mergeId: reviewId,
            filePath: firstFile.filePath,
            fileStatus: firstFile.fileStatus,
          }),
        );
      } else {
        // 全部文件crId均为空，则默认选中第一个文件
        dispatch(setCurrentFilePath(fileList[0].filePath));
        dispatch(setCurrentFileStatus(fileList[0].fileStatus));
      }
    }
  }, [fileList, currentFilePath, detailLoadError, dispatch]);

  // 构建树数据
  const treeData = useMemo(() => buildTreeData(fileList), [fileList]);

  // 点击文件树
  const onSelectFile = useCallback(
    (_, info) => {
      const { isLeaf, data } = info.node;
      if (isLeaf && data) {
        if (!data.crId || data.fileStatus === FILE_STATUS.REVIEWING) {
          // 如果crId为空或者文件状态为审查中，仅选中文件不发起请求
          dispatch(clearDetail());
          dispatch(setCurrentFilePath(data.filePath));
          dispatch(setCurrentFileStatus(data.fileStatus));
          return;
        }
        dispatch(clearDetail());
        dispatch(
          fetchFileDetail({
            crId: data.crId,
            mergeId: reviewId,
            filePath: data.filePath,
            fileStatus: data.fileStatus,
          }),
        );
      }
    },
    [dispatch],
  );

  // 处理反馈 (1:采纳, 2:忽略)
  const handleFeedback = (problem, status) => {
    dispatch(
      submitFeedback({
        crId: problem.crId,
        order: problem.order,
        status: status,
      }),
    );
  };

  /* ——— 可拖拽三栏宽度管理 ——— */

  const MIN_PANEL_PCT = 10; // 最小面板百分比

  const containerRef = useRef(null);
  // 三栏宽度百分比，默认 25% / 50% / 25%（对应 6:12:6）
  const [panelWidths, setPanelWidths] = useState([25, 50, 25]);
  const [dragging, setDragging] = useState(null); // 'left' | 'right' | null
  const draggingRef = useRef(null); // 同步副本，供mousemove读取
  const startXRef = useRef(0);
  const startWidthsRef = useRef([25, 50, 25]);
  const [hoverDivider, setHoverDivider] = useState(null); // 'left' | 'right'

  const onMouseDown = useCallback(
    (which, e) => {
      e.preventDefault();
      draggingRef.current = which;
      setDragging(which);
      startXRef.current = e.clientX;
      startWidthsRef.current = [...panelWidths];
    },
    [panelWidths],
  );

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!draggingRef.current || !containerRef.current) return;
      const containerWidth = containerRef.current.getBoundingClientRect().width;
      const dx = e.clientX - startXRef.current;
      const deltaPct = (dx / containerWidth) * 100;
      const prev = startWidthsRef.current;

      let newWidths;
      if (draggingRef.current === 'left') {
        let left = prev[0] + deltaPct;
        let mid = prev[1] - deltaPct;
        left = Math.max(
          MIN_PANEL_PCT,
          Math.min(left, prev[0] + prev[1] - MIN_PANEL_PCT),
        );
        mid = prev[0] + prev[1] - left;
        newWidths = [left, mid, prev[2]];
      } else {
        let mid = prev[1] + deltaPct;
        let right = prev[2] - deltaPct;
        mid = Math.max(
          MIN_PANEL_PCT,
          Math.min(mid, prev[1] + prev[2] - MIN_PANEL_PCT),
        );
        right = prev[1] + prev[2] - mid;
        newWidths = [prev[0], mid, right];
      }
      setPanelWidths(newWidths);
    };

    const onMouseUp = () => {
      draggingRef.current = null;
      setDragging(null);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  return (
    <div
      className={styles.sitePageHeaderGhostWrapper}
      // 1. 最外层：定高 100vh，隐藏溢出，垂直 Flex
    >
      {/* 头部区域：自然高度 */}
      <DetailHead aiTaskId={reviewId} codingJwt={codingJwt} />
      <Tabs defaultActiveKey="AI">
        <TabPane tab="AI质检" key="AI" />
      </Tabs>

      {activeTab === 'AI' ? (
        <Layout
          // 2. 主体区域：flex: 1 自动占满剩余高度
          // style={{
          //   display: "flex",
          //   flexDirection: "column",
          //   flex: 1,
          //   overflow: "hidden",
          // }}
          className={styles.layout}
        >
          <Content className={styles.contentWrapper}>
            {/* 使用 Flex div 替代 Space，更容易控制高度分配 */}
            <div className={styles.container}>
              {/* 下部分：三栏结构 */}
              {/* flex: 1 占据剩余所有空间，minHeight: 0 允许内部产生滚动条 */}
              <div className={styles.downThree}>
                {/* <Row gutter={12} className={styles.row}> */}
                <div
                  ref={containerRef}
                  className={styles.row}
                  style={{
                    display: 'flex',
                    userSelect: dragging ? 'none' : 'auto',
                  }}
                >
                  {/* 左：文件改动清单 */}
                  {/* <Col span={6} className={styles.leftCol}> */}
                  <div
                    className={styles.leftCol}
                    style={{
                      width: `${panelWidths[0]}%`,
                      minWidth: 0,
                    }}
                  >
                    <Card
                      title="文件改动"
                      size="small"
                      // style={{
                      //   height: "100%",
                      //   display: "flex",
                      //   flexDirection: "column",
                      // }}
                      headStyle={{ flex: '0 0 auto' }}
                      bodyStyle={{ flex: 1, overflow: 'auto' }}
                      className={styles.leftCard}
                    >
                      <FileTreeBody
                        loading={loadingSummary}
                        fileList={fileList}
                        treeData={treeData}
                        selectedKeys={currentFilePath ? [currentFilePath] : []}
                        onSelectFile={onSelectFile}
                      />
                    </Card>
                  </div>

                  {/* 左分割条 */}
                  <div
                    className={styles.divider}
                    onMouseDown={(e) => onMouseDown('left', e)}
                  >
                    <div
                      className={`${styles.dividerLine}${
                        dragging === 'left'
                          ? ` ${styles.dividerLineActive}`
                          : ''
                      }`}
                    />
                  </div>

                  {/* 中：Diff 视图 */}
                  {/* <Col span={9} className={styles.midCol}> */}
                  <div
                    className={styles.midCol}
                    style={{
                      width: `${panelWidths[1]}%`,
                      minWidth: 0,
                    }}
                  >
                    <Card
                      title={
                        <Space>
                          <span>变动代码块</span>
                          <Text type="secondary" title={currentFilePath}>
                            {currentFilePath || ''}
                          </Text>
                        </Space>
                      }
                      size="small"
                      // style={{
                      //   height: "100%",
                      //   display: "flex",
                      //   flexDirection: "column",
                      // }}
                      headStyle={{ flex: '0 0 auto' }}
                      bodyStyle={{ flex: 1, overflow: 'auto' }}
                      className={styles.midCard}
                    >
                      <DiffBody
                        loading={loadingDetail}
                        currentFileDiff={currentFileDiff}
                        locateLine={locateLine}
                        // TODO:fileStatus
                        fileStatus={currentFileStatus}
                      />
                    </Card>
                  </div>

                  {/* 右分割条 */}
                  <div
                    className={styles.divider}
                    onMouseDown={(e) => onMouseDown('right', e)}
                  >
                    <div
                      className={`${styles.dividerLine}${
                        dragging === 'right'
                          ? ` ${styles.dividerLineActive}`
                          : ''
                      }`}
                    />
                  </div>

                  {/* 右：审查结果 */}
                  {/* <Col span={9} style={{ height: "100%" }}> */}
                  <div
                    style={{
                      width: `${panelWidths[2]}%`,
                      height: '100%',
                      minWidth: 0,
                    }}
                  >
                    <Card
                      title="审查结果"
                      size="small"
                      // style={{
                      //   height: "100%",
                      //   display: "flex",
                      //   flexDirection: "column",
                      // }}
                      headStyle={{ flex: '0 0 auto' }}
                      bodyStyle={{
                        flex: 1,
                        overflow: 'auto',
                        padding: 0,
                      }}
                      className={styles.rightCard}
                    >
                      <ResultsBody
                        loading={loadingDetail}
                        results={currentFileProblems}
                        currentFilePath={currentFilePath}
                        handleFeedback={handleFeedback}
                        // TODO:fileStatus
                        fileStatus={currentFileStatus}
                      />
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </Content>
        </Layout>
      ) : null}
    </div>
  );
};

export default memo(CodeReviewPage);

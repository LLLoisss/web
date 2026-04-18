import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
  FileTextOutlined,
  SyncOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import {
  Badge,
  Card,
  Layout,
  Space,
  Tag,
  Typography,
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
import ResultsBody from './components/ResultsBody';

import styles from '@/views/index.less';

const { Content } = Layout;
const { Text } = Typography;

const renderLeafTitle = (fileName, file) => {
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
  if (reviewStatus === FILE_STATUS.UNSUPPORTED) {
    return (
      <Space size={6}>
        <span>{fileName}</span>
        <Tag color="default">不支持</Tag>
      </Space>
    );
  }

  return (
    <Space size={6}>
      <span>{fileName}</span>
      {stats.high > 0 && <Badge count={stats.high} size="small" />}
      {stats.medium > 0 && (
        <Badge count={stats.medium} size="small" color="#faad14" />
      )}
      {stats.low > 0 && (
        <Badge count={stats.low} size="small" color="#1890ff" />
      )}
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
          fileStatus: file.fileStatus,
        });
      } else {
        current = ensureChild(current, part);
      }
    });
  });

  const compress = (nodes) =>
    nodes.map((node) => {
      while (
        node.children &&
        node.children.length === 1 &&
        !node.children[0].isLeaf
      ) {
        const onlyChild = node.children[0];
        node.title = `${node.title}/${onlyChild.title}`;
        node.key = onlyChild.key;
        node.children = onlyChild.children;
      }

      if (node.children && node.children.length > 0) {
        node.children = compress(node.children);
      }
      return node;
    });

  console.log('flatFileList :>> ', flatFileList);
  console.log('compress(root.children) :>> ', compress(root.children));
  return compress(root.children);
};

const CodeReviewContent = ({ reviewId }) => {
  const dispatch = useDispatch();

  const {
    fileList,
    loadingSummary,
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
    if (reviewId) dispatch(fetchReviewSummary(reviewId));
    return () => {
      dispatch(resetAllCache());
    };
  }, [reviewId, dispatch]);

  // 当文件列表加载完毕，且当前没有选中文件时，触发第一个文件的加载
  useEffect(() => {
    if (fileList.length > 0 && !currentFilePath && !detailLoadError) {
      const firstFile = fileList.find(
        (file) => file.fileStatus !== FILE_STATUS.UNSUPPORTED,
      );
      if (firstFile) {
        dispatch(
          fetchFileDetail({
            id: firstFile.id,
            crId: firstFile.crId || null,
            filePath: firstFile.filePath,
            fileStatus: firstFile.fileStatus,
          }),
        );
      } else {
        dispatch(setCurrentFilePath(fileList[0].filePath, fileList[0].id));
        dispatch(setCurrentFileStatus(fileList[0].fileStatus));
      }
    }
  }, [fileList, currentFilePath, detailLoadError, dispatch]);

  const treeData = useMemo(() => buildTreeData(fileList), [fileList]);

  const onSelectFile = useCallback(
    (_, info) => {
      const { isLeaf, data } = info.node;
      if (isLeaf && data) {
        if (data.fileStatus === FILE_STATUS.UNSUPPORTED) {
          dispatch(clearDetail());
          dispatch(setCurrentFilePath(data.filePath, data.id));
          dispatch(setCurrentFileStatus(data.fileStatus));
          return;
        }
        dispatch(clearDetail());
        dispatch(
          fetchFileDetail({
            id: data.id,
            crId: data.crId || null,
            filePath: data.filePath,
            fileStatus: data.fileStatus,
          }),
        );
      }
    },
    [dispatch],
  );

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

  const MIN_PANEL_PCT = 10;

  const containerRef = useRef(null);
  const [panelWidths, setPanelWidths] = useState([25, 50, 25]);
  const [dragging, setDragging] = useState(null);
  const draggingRef = useRef(null);
  const startXRef = useRef(0);
  const startWidthsRef = useRef([25, 50, 25]);

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
    <Layout className={styles.layout}>
      <Content className={styles.contentWrapper}>
        <div className={styles.container}>
          <div className={styles.downThree}>
            <div
              ref={containerRef}
              className={styles.row}
              style={{
                display: 'flex',
                userSelect: dragging ? 'none' : 'auto',
              }}
            >
              {/* 左：文件改动清单 */}
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
                  headStyle={{ flex: '0 0 auto' }}
                  bodyStyle={{ flex: 1, overflow: 'auto' }}
                  className={styles.midCard}
                >
                  <DiffBody
                    loading={loadingDetail}
                    currentFileDiff={currentFileDiff}
                    locateLine={locateLine}
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
                    fileStatus={currentFileStatus}
                  />
                </Card>
              </div>
            </div>
          </div>
        </div>
      </Content>
    </Layout>
  );
};

export default CodeReviewContent;

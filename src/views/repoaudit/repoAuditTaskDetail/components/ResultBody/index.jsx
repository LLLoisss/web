import React, { memo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';

import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from '@ant-design/icons';
import {
  Empty,
  List,
  Skeleton,
  Space,
  Tag,
  Typography,
  Collapse,
  Button,
} from 'antd';
import {
  vscDarkPlus,
  github,
  oneLight,
} from 'react-syntax-highlighter/dist/esm/styles/prism';

import { ISSUE_LEVELS, ORDER_STATUS } from '@/common/constant';

import styles from './index.less';

const { Text } = Typography;
const { Panel } = Collapse;

const levelTag = (issueLevel) => {
  switch (issueLevel) {
    case ISSUE_LEVELS.HIGH:
      return <Tag color="red">高</Tag>;
    case ISSUE_LEVELS.MEDIUM:
      return <Tag color="orange">中</Tag>;
    case ISSUE_LEVELS.LOW:
      return <Tag color="blue">低</Tag>;
    default:
      return <Tag>默认</Tag>;
  }
};

const ResultsBody = ({
  loading,
  results, // resultsForSelectedHunk
  currentFilePath,
  handleFeedback,
  fileStatus,
}) => {
  if (loading) {
    return (
      <div style={{ padding: 12 }}>
        <Skeleton active />
      </div>
    );
  }
  if (fileStatus === 0)
    return <Empty description="审查中, 请稍后刷新再试..." />;
  if (fileStatus === 2) return <Empty description="审查失败" />;

  if (!results.length) {
    return (
      <div style={{ padding: 12 }}>
        <Empty description="当前范围暂无审查结果（可能该变动没问题）" />
      </div>
    );
  }
  // 哪些被激活
  const [activeKeys, setActiveKeys] = useState([]);
  const [seenResults, setSeenResults] = useState(new Set()); // 记录已展开过的结果id
  // 处理 Collapse 展开/收起
  const onCollapseChange = (keys) => {
    console.log('results :>> ', results);
    console.log('keys :>> ', keys);
    setActiveKeys(keys); // keys 是字符串数组，如 ['2', '3']
    // 取出最后一个被激活的key
    const activeKey = Array.isArray(keys) ? keys[keys.length - 1] : keys;
    // 找到相应的item
    const item = results.find((r) => String(r.id) === activeKey);
    if (item && !seenResults.has(item.id)) {
      // 首次展开
      setSeenResults((prev) => {
        const next = new Set(prev);
        next.add(item.id);
        return next;
      });
      // 向后端发送请求
      console.log('向后端发送请求 :>> ', item.id);
    }
  };

  return (
    <List
      itemLayout="vertical"
      dataSource={results}
      renderItem={(item) => {
        // 判断当前 item 是否展开（active）
        const isActive = activeKeys.includes(String(item.order));
        const isAccepted = item.status === ORDER_STATUS.ACCEPTED;
        const isIgnored = item.status === ORDER_STATUS.IGNORED;
        const fullBottomLabel = `${currentFilePath}${
          item.updateTime ? ` · ${item.updateTime}` : ''
        }`;
        return (
          <List.Item
            key={item.id}
            className={styles.listItem}
            style={{
              background: isActive ? 'rgba(24, 144, 255, 0.08)' : 'transparent',
            }}
          >
            <Collapse activeKey={activeKeys} onChange={onCollapseChange}>
              <Panel
                header={
                  <Space className={styles.listCollapsePanelSpace}>
                    {/* 左侧 */}
                    <Space style={{ flexShrink: 0, minWidth: '20px' }}>
                      {levelTag(item.issueLevel)}
                    </Space>
                    {/* 中间 */}
                    <Text className={styles.listCollapsePanelTex}>
                      {item.issueType}
                      {seenResults.has(item.id) ? (
                        <EyeOutlined
                          title="已经查看过"
                          style={{ color: '#1890ff', marginLeft: '8px' }}
                        />
                      ) : (
                        <EyeOutlined
                          title="还没查看过"
                          style={{ marginLeft: '8px' }}
                        />
                      )}
                    </Text>

                    {/* 右边 */}
                    {item.status === 0 ? (
                      <Space style={{ minWidth: '20px' }}>
                        <Button
                          size="small"
                          type="primary"
                          ghost
                          icon={<CheckCircleOutlined />}
                          onClick={(e) => {
                            e.stopPropagation(); // 阻止 Collapse 切换
                            handleFeedback(item, 1);
                          }}
                        >
                          采纳
                        </Button>
                        <Button
                          size="small"
                          default
                          icon={<CloseCircleOutlined />}
                          onClick={(e) => {
                            e.stopPropagation(); // 阻止 Collapse 切换
                            handleFeedback(item, 2);
                          }}
                          style={{ color: 'gray' }}
                          className={styles.customButton}
                        >
                          忽略
                        </Button>
                      </Space>
                    ) : (
                      <Tag color={isAccepted ? 'success' : 'default'}>
                        {isAccepted ? '已采纳' : '已忽略'}
                      </Tag>
                    )}
                  </Space>
                }
                key={item.id}
              >
                <ReactMarkdown
                  components={{
                    code(props) {
                      const { children, className, node, ...rest } = props;
                      const match = /language-(\w+)/.exec(className || '');
                      // 1. 检查是否有语言标记 (例如 ```js )
                      const language = match?.[1];

                      // 2. 只有当匹配到语言 且 不是行内代码时，才使用高亮组件
                      return language ? (
                        <div className={styles.reactMarkdownContainer}>
                          {/* 左上角语言标识 */}
                          <div
                            className={styles.reactMarkdownLanguageContainer}
                          >
                            {language}
                          </div>

                          <SyntaxHighlighter
                            {...rest}
                            PreTag="div"
                            language={language}
                            style={oneLight}
                            customStyle={{
                              margin: 0,
                              paddingTop: '32px',
                              background: 'transparent', //  让外层背景生效
                              borderRadius: '10px',
                            }}
                            codeTagProps={{
                              style: {
                                color: '#555', // 默认文字
                                fontWeight: 500,
                              },
                            }}
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        </div>
                      ) : (
                        // 3. 否则作为普通行内代码处理 (如 `variable`)
                        <code
                          {...rest}
                          className={`${className} ${styles.reactMarkdownCodeContainer}`}
                        >
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {item.issueDetail}
                </ReactMarkdown>
              </Panel>
            </Collapse>

            <div style={{ marginTop: 6 }}>
              <Text
                type="secondary"
                style={{ fontSize: 12 }}
                title={fullBottomLabel}
              >
                {fullBottomLabel}
              </Text>
            </div>
          </List.Item>
        );
      }}
    />
  );
};

export default memo(ResultsBody);

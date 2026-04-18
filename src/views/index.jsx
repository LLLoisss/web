import React, {
  memo,
  useState,
} from 'react';
import { useLocation } from 'react-router-dom';

import {
  Tabs,
} from 'antd';

import CodeReviewContent from './repoaudit/repoAuditTaskDetail/codeReview';
import DetailHead from './detailHead';

import styles from './index.less';

const { TabPane } = Tabs;

const CodeReviewPage = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const reviewId = queryParams.get('id');
  const [activeTab] = useState('AI');
  const codingJwt = queryParams.get('data');

  return (
    <div className={styles.sitePageHeaderGhostWrapper}>
      <DetailHead aiTaskId={reviewId} codingJwt={codingJwt} />
      <Tabs defaultActiveKey="AI">
        <TabPane tab="AI质检" key="AI" />
      </Tabs>

      {activeTab === 'AI' ? <CodeReviewContent reviewId={reviewId} /> : null}
    </div>
  );
};

export default memo(CodeReviewPage);

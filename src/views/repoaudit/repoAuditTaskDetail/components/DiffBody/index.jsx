import React, { memo } from 'react';

import { Empty, Skeleton, Space } from 'antd';

import ReviewDiff from './ReviewDiff';

const DiffBody = ({ loading, currentFileDiff, fileStatus }) => {
  if (loading) return <Skeleton active />;
  if (fileStatus === 0)
    return <Empty description="审查中, 请稍后刷新再试..." />;
  if (!currentFileDiff) {
    console.log('fileStatus :>> ', fileStatus);
    return <Empty description="该文件暂无代码块" />;
  }

  return (
    <Space direction="vertical" size={12} style={{ minWidth: '100%' }}>
      <ReviewDiff diffText={currentFileDiff || ''} />
    </Space>
  );
};

export default memo(DiffBody);

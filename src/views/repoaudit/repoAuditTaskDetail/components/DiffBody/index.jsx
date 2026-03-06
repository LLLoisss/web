import React, { memo } from 'react';

import { Empty, Skeleton, Space } from 'antd';

import { FILE_STATUS } from '@/common/constant';

import ReviewDiff from './ReviewDiff';

const DiffBody = ({ loading, currentFileDiff, fileStatus }) => {
  if (loading) return <Skeleton active />;
  if (fileStatus === FILE_STATUS.REVIEWING)
    return <Empty description="审查中, 请稍后刷新再试..." />;
  if (!currentFileDiff) {
    return <Empty description="该文件暂无代码块" />;
  }

  return (
    <Space direction="vertical" size={12} style={{ minWidth: '100%' }}>
      <ReviewDiff diffText={currentFileDiff || ''} />
    </Space>
  );
};

export default memo(DiffBody);

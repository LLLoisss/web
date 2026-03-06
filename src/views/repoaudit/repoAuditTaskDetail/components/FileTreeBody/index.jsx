import React, { memo } from 'react';

import { Empty, Skeleton, Tree } from 'antd';

const { DirectoryTree } = Tree;

const FileTreeBody = ({
  loading,
  fileList,
  treeData,
  selectedKeys,
  onSelectFile,
}) => {
  if (loading) return <Skeleton active />;
  if (!fileList.length) return <Empty description="暂无文件改动" />;

  return (
    <DirectoryTree
      // showIcon
      blockNode
      expandAction="click"
      treeData={treeData}
      selectedKeys={selectedKeys}
      onSelect={onSelectFile}
      defaultExpandAll
      style={{
        width: '100%',
      }}
    />
  );
};

export default memo(FileTreeBody);

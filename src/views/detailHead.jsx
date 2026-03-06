import React, { memo } from 'react';
import { Space, Tag, Typography } from 'antd';
import { BranchesOutlined, UserOutlined } from '@ant-design/icons';

const { Text } = Typography;

/**
 * 页面头部：显示 MR 基本信息
 * props: aiTaskId, codingJwt
 */
const DetailHead = ({ aiTaskId }) => (
  <div
    style={{
      padding: '8px 16px',
      borderBottom: '1px solid #f0f0f0',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      background: '#fff',
      flexShrink: 0,
    }}
  >
    <BranchesOutlined />
    <Text strong>代码审查</Text>
    {aiTaskId && (
      <Tag color="blue">
        <UserOutlined /> 任务&nbsp;{aiTaskId}
      </Tag>
    )}
  </div>
);

export default memo(DetailHead);

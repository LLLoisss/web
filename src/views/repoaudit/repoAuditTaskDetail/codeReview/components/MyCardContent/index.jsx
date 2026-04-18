import React, { memo } from 'react';

/**
 * MyCardContent - 通用卡片内容占位组件
 */
const MyCardContent = ({ children }) => <div>{children}</div>;

export default memo(MyCardContent);

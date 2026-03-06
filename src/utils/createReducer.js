/**
 * 根据 ACTION_HANDLERS 对象创建 reducer
 * @param {object} initialState - 初始状态
 * @param {object} handlers - { [actionType]: (state, action) => newState }
 */
const createReducer = (initialState, handlers) => {
  return function reducer(state = initialState, action) {
    const handler = handlers[action.type];
    return handler ? handler(state, action) : state;
  };
};

export default createReducer;

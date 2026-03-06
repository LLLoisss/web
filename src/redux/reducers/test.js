import createReducer from '@/utils/createReducer';
import initState from '@/redux/store/initState';

const SET_TEST_STATE = 'SET_TEST_STATE';
const SET_TEST_STATE2 = 'SET_TEST_STATE2';

const ACTION_HANDLERS = {
  [SET_TEST_STATE]: (state, { payload }) => ({ ...state, testState: payload }),
  [SET_TEST_STATE2]: (state, { payload }) => ({
    ...state,
    testState2: payload,
  }),
};

export default createReducer(initState.test, ACTION_HANDLERS);

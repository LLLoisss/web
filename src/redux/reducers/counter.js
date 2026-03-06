import createReducer from '@/utils/createReducer';
import initState from '@/redux/store/initState';

const INCREMENT = 'INCREMENT';
const DECREMENT = 'DECREMENT';

const ACTION_HANDLERS = {
  [INCREMENT]: (state) => ({ ...state, count: state.count + 1 }),
  [DECREMENT]: (state) => ({ ...state, count: state.count - 1 }),
};

export default createReducer(initState.counter, ACTION_HANDLERS);

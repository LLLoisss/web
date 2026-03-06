import { combineReducers } from 'redux';

import counterReducer from '@/redux/reducers/counter';
import reviewReducer from '@/redux/reducers/review';
import userReducer from '@/redux/reducers/user';

import testReducer from './test';

export function createRootReducer() {
  return combineReducers({
    userData: userReducer,
    counter: counterReducer,
    test: testReducer,
    review: reviewReducer,
  });
}

import { applyMiddleware, compose, createStore } from 'redux';

import { createRootReducer } from '@/redux/reducers';

import middlewares from './middlewares';

const store = createStore(
  createRootReducer(),
  {},
  compose(applyMiddleware(...middlewares)),
);
export default store;

import thunk from 'redux-thunk';
import { createLogger } from 'redux-logger';

const logger = createLogger({
  collapsed: true,
  diff: false,
});

const middlewares =
  process.env.NODE_ENV === 'development' ? [thunk, logger] : [thunk];

export default middlewares;

import { ACTION_HANDLERS } from '@/redux/actions/review';
import initState from '@/redux/store/initState';
import createReducer from '@/utils/createReducer';

export default createReducer(initState.review, ACTION_HANDLERS);

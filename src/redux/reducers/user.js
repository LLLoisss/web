import createReducer from '@/utils/createReducer';
import initState from '@/redux/store/initState';

const LOGIN_SUCCESS = 'LOGIN_SUCCESS';
const LOGOUT = 'LOGOUT';

const ACTION_HANDLERS = {
  [LOGIN_SUCCESS]: (state, { payload }) => ({
    ...state,
    isLoginSuccess: true,
    userName: payload.userName || '',
  }),
  [LOGOUT]: (state) => ({
    ...state,
    isLoginSuccess: false,
    userName: '',
  }),
};

export default createReducer(initState.userData, ACTION_HANDLERS);

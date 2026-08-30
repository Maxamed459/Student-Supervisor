import { createSlice } from '@reduxjs/toolkit';
import { tokenStore } from '../../services/apiClient';

const initialState = {
    user: tokenStore.getUser(),
    token: tokenStore.getAccessToken(),
    isAuthenticated: Boolean(tokenStore.getAccessToken()),
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setSession: (state, action) => {
            state.user = action.payload?.user ?? null;
            state.token = action.payload?.accessToken ?? null;
            state.isAuthenticated = Boolean(action.payload?.accessToken);
        },
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
        },
    },
});

export const { setSession, logout } = authSlice.actions;
export default authSlice.reducer;

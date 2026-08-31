// ToastContext value, split into its own file so that
// `ToastContext.jsx` only exports the React component (which keeps
// react-refresh / fast-refresh happy — see CLAUDE.md "context/"
// section).
import { createContext } from 'react';

export const ToastContext = createContext(null);

import { useCallback, useState } from 'react';
import { ConfirmDialog } from '../components/dialogs';

export function useConfirmDialog() {
  const [state, setState] = useState(null);

  const askConfirm = useCallback((options) => new Promise((resolve) => {
    setState({ ...options, resolve });
  }), []);

  const close = useCallback((result) => {
    setState((current) => {
      current?.resolve?.(result);
      return null;
    });
  }, []);

  const dialog = state ? (
    <ConfirmDialog
      open
      title={state.title}
      description={state.description}
      confirmLabel={state.confirmLabel || 'Confirm'}
      destructive={state.destructive}
      onCancel={() => close(false)}
      onConfirm={() => close(true)}
    />
  ) : null;

  return { askConfirm, confirmDialog: dialog };
}

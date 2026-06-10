import { ActionButton } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useState } from 'react';

// Any annotation change bumps resourceVersion, which causes the controller's
// watch to fire and triggers a fresh reconcile — same as `kubectl annotate ... --overwrite`.
const RECONCILE_ANNOTATION = 'swefarm.com/reconcile-requested-at';

type Status = 'idle' | 'loading' | 'success' | 'error';

interface ReconcileButtonProps {
  resource: { patch: (body: any) => Promise<any> };
}

export function ReconcileButton({ resource }: ReconcileButtonProps) {
  const [status, setStatus] = useState<Status>('idle');

  function handleClick() {
    setStatus('loading');
    resource
      .patch({ metadata: { annotations: { [RECONCILE_ANNOTATION]: new Date().toISOString() } } })
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }

  const description =
    status === 'success' ? 'Reconcile triggered' :
    status === 'error' ? 'Failed to trigger reconcile' :
    'Trigger reconcile';

  const icon =
    status === 'success' ? 'mdi:check' :
    status === 'error' ? 'mdi:alert-circle-outline' :
    'mdi:refresh';

  return (
    <ActionButton
      description={description}
      icon={icon}
      width={20}
      onClick={handleClick}
      iconButtonProps={{ size: 'small', disabled: status === 'loading' }}
    />
  );
}

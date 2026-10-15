'use client';

import { deployment } from '@/lib/chain';
import { useDeploymentVerification } from '@/lib/deployment-verification';

export function ModeBanner() {
  const verification = useDeploymentVerification();
  if (verification.verified) return null;
  return (
    <div className="mode-banner" role="status">
      <strong>
        {deployment.mode === 'preview'
          ? 'Preview mode'
          : verification.loading
            ? 'Verifying deployment'
            : 'Writes locked'}
      </strong>
      <span>
        {deployment.mode === 'preview'
          ? 'Preview configuration. No verified contract is configured here; payments are disabled.'
          : verification.reason}
      </span>
      {verification.configured && !verification.loading && (
        <button
          className="text-button"
          type="button"
          onClick={() => void verification.retry()}
        >
          Retry verification
        </button>
      )}
    </div>
  );
}

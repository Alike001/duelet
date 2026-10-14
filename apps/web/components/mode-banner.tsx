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
          ? 'Illustrative data only. No contract is deployed and payments are disabled.'
          : verification.reason}
      </span>
    </div>
  );
}

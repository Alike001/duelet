import { deployment } from '@/lib/chain';

export function ModeBanner() {
  if (deployment.mode === 'deployed') return null;
  return (
    <div className="mode-banner" role="status">
      <strong>Preview mode</strong>
      <span>
        No Duelet contract is configured or deployed. Illustrations are labeled;
        writes are disabled.
      </span>
    </div>
  );
}

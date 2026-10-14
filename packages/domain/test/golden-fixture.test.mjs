import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const fixtureUrl = new URL(
  '../../../fixtures/invoice-stream-golden.json',
  import.meta.url,
);

test('the shared cancellation fixture matches the locked integer accounting', async () => {
  const fixture = JSON.parse(await readFile(fixtureUrl, 'utf8'));
  const total = BigInt(fixture.totalAmount);
  const vested =
    (total * BigInt(fixture.elapsedSeconds)) / BigInt(fixture.durationSeconds);
  const withdrawn = BigInt(fixture.withdrawnBeforeCancellation);
  const refund = total - vested;
  const remainingEntitlement = vested - withdrawn;

  assert.equal(vested, BigInt(fixture.vestedAmount));
  assert.equal(refund, BigInt(fixture.refundedAmount));
  assert.equal(total - vested, BigInt(fixture.unvestedAmount));
  assert.equal(remainingEntitlement, BigInt(fixture.remainingPayeeEntitlement));
  assert.equal(
    withdrawn + remainingEntitlement,
    BigInt(fixture.finalWithdrawnTotal),
  );
  assert.equal(vested + refund, BigInt(fixture.finalAccountingTotal));
  assert.equal(fixture.clock, 'deterministic-test-only');
});

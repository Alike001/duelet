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
  const vestedAtFirstWithdrawal =
    (total * BigInt(fixture.firstWithdrawalElapsedSeconds)) /
    BigInt(fixture.durationSeconds);
  const vestedAtCancellation =
    (total * BigInt(fixture.cancellationElapsedSeconds)) /
    BigInt(fixture.durationSeconds);
  const withdrawn = BigInt(fixture.withdrawnBeforeCancellation);
  const refund = total - vestedAtCancellation;
  const remainingEntitlement = vestedAtCancellation - withdrawn;

  assert.equal(
    vestedAtFirstWithdrawal,
    BigInt(fixture.vestedAmountAtFirstWithdrawal),
  );
  assert.equal(withdrawn, vestedAtFirstWithdrawal);
  assert.equal(
    vestedAtCancellation,
    BigInt(fixture.vestedAmountAtCancellation),
  );
  assert.equal(refund, BigInt(fixture.refundedAmount));
  assert.equal(total - vestedAtCancellation, BigInt(fixture.unvestedAmount));
  assert.equal(remainingEntitlement, BigInt(fixture.remainingPayeeEntitlement));
  assert.equal(
    withdrawn + remainingEntitlement,
    BigInt(fixture.finalWithdrawnTotal),
  );
  assert.equal(
    vestedAtCancellation + refund,
    BigInt(fixture.finalAccountingTotal),
  );
  assert.equal(fixture.clock, 'deterministic-test-only');
});

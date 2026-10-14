'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  encodeAbiParameters,
  encodeFunctionData,
  getAddress,
  isAddress,
  keccak256,
  stringToHex,
  zeroHash,
} from 'viem';
import {
  useBalance,
  useConnection,
  useEstimateGas,
  useGasPrice,
  useReadContract,
  useSimulateContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi';

import { dueletAbi, erc20Abi } from '@/lib/abi';
import { ARC_CHAIN_ID, ARC_USDC_ADDRESS, deployment, txUrl } from '@/lib/chain';
import { useDeploymentVerification } from '@/lib/deployment-verification';
import {
  formatUsdc,
  hasExactApproval,
  parseUsdc,
  shortHash,
} from '@/lib/finance';

const DOMAIN = keccak256(stringToHex('ARC_INVOICE_STREAM_V1'));

export function CreateInvoiceForm() {
  const connection = useConnection();
  const deploymentVerification = useDeploymentVerification();
  const [payee, setPayee] = useState('');
  const [amount, setAmount] = useState('0.010000');
  const [reference, setReference] = useState('');
  const [description, setDescription] = useState('');
  const [startMode, setStartMode] = useState<'now' | 'future'>('now');
  const [startValue, setStartValue] = useState('');
  const [duration, setDuration] = useState('180');
  const [generatedReference, setGeneratedReference] = useState('');
  const [observedNow, setObservedNow] = useState<number | null>(null);
  const [replacementNotice, setReplacementNotice] = useState('');

  useEffect(() => {
    setGeneratedReference(`DUE-${crypto.randomUUID()}`);
    const updateClock = () => setObservedNow(Math.floor(Date.now() / 1000));
    updateClock();
    const clock = window.setInterval(updateClock, 5_000);
    return () => window.clearInterval(clock);
  }, []);

  const parsed = useMemo(() => {
    const errors: string[] = [];
    let baseUnits = 0n;
    try {
      baseUnits = parseUsdc(amount);
      if (baseUnits === 0n) errors.push('Amount must be greater than zero.');
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Invalid amount.');
    }
    const validPayee = isAddress(payee);
    if (!validPayee) errors.push('Enter a valid payee address.');
    if (validPayee && connection.address?.toLowerCase() === payee.toLowerCase())
      errors.push('Payer and payee must be different.');
    const seconds = /^\d+$/.test(duration) ? BigInt(duration) : 0n;
    if (seconds <= 0n) errors.push('Duration must be at least one second.');
    const now = BigInt(observedNow ?? 0);
    const requestedStart =
      startMode === 'now'
        ? 0n
        : startValue
          ? BigInt(Math.floor(new Date(startValue).getTime() / 1000))
          : 0n;
    if (
      startMode === 'future' &&
      (!startValue || (observedNow !== null && requestedStart < now))
    )
      errors.push('Future start must not be historical.');
    const resolvedStart = requestedStart === 0n ? now : requestedStart;
    const end = resolvedStart + seconds;
    const effectiveReference = reference.trim() || generatedReference;
    const referenceHash = effectiveReference
      ? keccak256(stringToHex(effectiveReference))
      : zeroHash;
    if (referenceHash === zeroHash)
      errors.push('Preparing a unique private invoice reference.');
    const metadataHash = description.trim()
      ? keccak256(stringToHex(description.trim()))
      : zeroHash;
    let invoiceId: `0x${string}` | undefined;
    if (deployment.address && connection.address && referenceHash !== zeroHash)
      invoiceId = keccak256(
        encodeAbiParameters(
          [
            { type: 'bytes32' },
            { type: 'uint256' },
            { type: 'address' },
            { type: 'address' },
            { type: 'bytes32' },
          ],
          [
            DOMAIN,
            BigInt(ARC_CHAIN_ID),
            deployment.address,
            connection.address,
            referenceHash,
          ],
        ),
      );
    return {
      errors,
      baseUnits,
      requestedStart,
      resolvedStart,
      end,
      referenceHash,
      metadataHash,
      invoiceId,
      effectiveReference,
    };
  }, [
    amount,
    connection.address,
    duration,
    payee,
    reference,
    description,
    generatedReference,
    observedNow,
    startMode,
    startValue,
  ]);

  const ready =
    parsed.errors.length === 0 &&
    deployment.address &&
    deploymentVerification.verified &&
    connection.address &&
    connection.chainId === ARC_CHAIN_ID;
  const balance = useReadContract({
    address: ARC_USDC_ADDRESS,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: connection.address ? [connection.address] : undefined,
    query: { enabled: Boolean(connection.address) },
  });
  const allowance = useReadContract({
    address: ARC_USDC_ADDRESS,
    abi: erc20Abi,
    functionName: 'allowance',
    args:
      connection.address && deployment.address
        ? [connection.address, deployment.address]
        : undefined,
    query: { enabled: Boolean(connection.address && deployment.address) },
  });
  const simulation = useSimulateContract({
    address: deployment.address,
    abi: dueletAbi,
    functionName: 'createAndFund',
    args:
      ready && isAddress(payee)
        ? [
            parsed.referenceHash,
            getAddress(payee),
            parsed.baseUnits,
            parsed.requestedStart,
            parsed.end,
            parsed.metadataHash,
          ]
        : undefined,
    account: connection.address,
    chainId: ARC_CHAIN_ID,
    query: {
      enabled: Boolean(
        ready &&
        hasExactApproval(allowance.data, parsed.baseUnits) &&
        (balance.data ?? 0n) >= parsed.baseUnits,
      ),
    },
  });
  const approval = useWriteContract();
  const funding = useWriteContract();
  const approvalReceipt = useWaitForTransactionReceipt({
    hash: approval.data,
    confirmations: 1,
    onReplaced: ({ reason }) =>
      setReplacementNotice(`Approval transaction was ${reason}.`),
  });
  const fundingReceipt = useWaitForTransactionReceipt({
    hash: funding.data,
    confirmations: 1,
    onReplaced: ({ reason }) =>
      setReplacementNotice(`Funding transaction was ${reason}.`),
  });
  const hasExactAllowance = hasExactApproval(allowance.data, parsed.baseUnits);
  const hasExcessAllowance =
    allowance.data !== undefined && allowance.data > parsed.baseUnits;
  const hasBalance = (balance.data ?? 0n) >= parsed.baseUnits;
  const approvalData = deployment.address
    ? encodeFunctionData({
        abi: erc20Abi,
        functionName: 'approve',
        args: [deployment.address, parsed.baseUnits],
      })
    : undefined;
  const fundingData =
    ready && isAddress(payee)
      ? encodeFunctionData({
          abi: dueletAbi,
          functionName: 'createAndFund',
          args: [
            parsed.referenceHash,
            getAddress(payee),
            parsed.baseUnits,
            parsed.requestedStart,
            parsed.end,
            parsed.metadataHash,
          ],
        })
      : undefined;
  const approvalGas = useEstimateGas({
    account: connection.address,
    chainId: ARC_CHAIN_ID,
    to: ARC_USDC_ADDRESS,
    data: approvalData,
    query: { enabled: Boolean(ready && approvalData && !hasExactAllowance) },
  });
  const fundingGas = useEstimateGas({
    account: connection.address,
    chainId: ARC_CHAIN_ID,
    to: deployment.address,
    data: fundingData,
    query: { enabled: Boolean(ready && fundingData && hasExactAllowance) },
  });
  const gasPrice = useGasPrice({
    chainId: ARC_CHAIN_ID,
    query: { enabled: Boolean(ready) },
  });
  const nativeBalance = useBalance({
    address: connection.address,
    chainId: ARC_CHAIN_ID,
    query: { enabled: Boolean(ready) },
  });
  const currentGas = hasExactAllowance ? fundingGas.data : approvalGas.data;
  const estimatedFee =
    currentGas && gasPrice.data ? currentGas * gasPrice.data : undefined;
  const estimatedFeeUsdcUnits =
    estimatedFee === undefined
      ? undefined
      : (estimatedFee + 999_999_999_999n) / 1_000_000_000_000n;
  const hasGas =
    estimatedFee === undefined ||
    nativeBalance.data === undefined ||
    nativeBalance.data.value >= estimatedFee;
  const hasFundingReserve =
    estimatedFee === undefined ||
    nativeBalance.data === undefined ||
    nativeBalance.data.value >=
      parsed.baseUnits * 1_000_000_000_000n + estimatedFee;
  const refetchAllowance = allowance.refetch;
  const refetchBalance = balance.refetch;

  useEffect(() => {
    if (approvalReceipt.isSuccess) void refetchAllowance();
  }, [approvalReceipt.isSuccess, refetchAllowance]);

  useEffect(() => {
    if (!fundingReceipt.isSuccess) return;
    void refetchAllowance();
    void refetchBalance();
  }, [fundingReceipt.isSuccess, refetchAllowance, refetchBalance]);

  function approve() {
    if (!deployment.address) return;
    approval.writeContract({
      address: ARC_USDC_ADDRESS,
      abi: erc20Abi,
      functionName: 'approve',
      args: [deployment.address, parsed.baseUnits],
      chainId: ARC_CHAIN_ID,
    });
  }
  function fund() {
    if (!simulation.data?.request) return;
    funding.writeContract(simulation.data.request);
  }

  return (
    <div className="create-layout">
      <form
        className="invoice-form"
        onSubmit={(event) => event.preventDefault()}
      >
        <section className="form-section">
          <div className="form-section-title">
            <span>1</span>
            <div>
              <h2>Recipient and amount</h2>
              <p>Choose who receives the payment and how much to lock.</p>
            </div>
          </div>
          <label>
            Recipient wallet address
            <input
              value={payee}
              onChange={(event) => setPayee(event.target.value)}
              placeholder="0x…"
              autoComplete="off"
              spellCheck={false}
            />
          </label>
          <label>
            Invoice amount
            <div className="amount-input">
              <input
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                inputMode="decimal"
                aria-describedby="amount-help"
              />
              <span>USDC</span>
            </div>
            <small id="amount-help">
              Six decimal places maximum · {parsed.baseUnits.toString()} base
              units
            </small>
          </label>
        </section>
        <section className="form-section">
          <div className="form-section-title">
            <span>2</span>
            <div>
              <h2>Payment schedule</h2>
              <p>Choose when the recipient begins earning the payment.</p>
            </div>
          </div>
          <fieldset>
            <legend>Start time</legend>
            <div className="segmented">
              <button
                className={startMode === 'now' ? 'active' : ''}
                onClick={() => setStartMode('now')}
                type="button"
              >
                Start when funded
              </button>
              <button
                className={startMode === 'future' ? 'active' : ''}
                onClick={() => setStartMode('future')}
                type="button"
              >
                Future start
              </button>
            </div>
          </fieldset>
          {startMode === 'future' && (
            <label>
              Future start, local time
              <input
                type="datetime-local"
                value={startValue}
                onChange={(event) => setStartValue(event.target.value)}
              />
            </label>
          )}
          <label>
            Duration in seconds
            <input
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
              inputMode="numeric"
            />
            <small>Use at least 180 seconds for an observable canary.</small>
          </label>
        </section>
        <section className="form-section">
          <div className="form-section-title">
            <span>3</span>
            <div>
              <h2>Invoice details</h2>
              <p>Add a private reference for your own records.</p>
            </div>
          </div>
          <label>
            Invoice reference <em>optional</em>
            <input
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              placeholder="e.g. DUE-0042"
            />
            <small>
              Hashed locally before transaction preparation. If blank, Duelet
              generates a unique private reference for this draft.
            </small>
          </label>
          <label>
            Public metadata commitment <em>optional</em>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="A non-sensitive phrase to commit as a public hash"
              rows={3}
            />
            <small>
              A hash is not encryption and short phrases can be guessed. Never
              enter names, addresses, invoice documents, or confidential terms.
            </small>
          </label>
        </section>
      </form>
      <aside className="review-card">
        <div className="review-head">
          <div>
            <p className="page-kicker">Review and fund</p>
            <h2>Payment summary</h2>
          </div>
          <span className="status-pill amber">
            {deployment.mode === 'preview' ? 'Preview only' : 'Not signed'}
          </span>
        </div>
        <dl>
          <div>
            <dt>Exact deposit</dt>
            <dd>{formatUsdc(parsed.baseUnits)} USDC</dd>
          </div>
          <div>
            <dt>Payer</dt>
            <dd>
              {connection.address
                ? shortHash(connection.address, 7)
                : 'Wallet not connected'}
            </dd>
          </div>
          <div>
            <dt>Recipient</dt>
            <dd>
              {isAddress(payee) ? shortHash(payee, 7) : 'Invalid or missing'}
            </dd>
          </div>
          <div>
            <dt>Reference</dt>
            <dd>{parsed.effectiveReference || 'Preparing…'}</dd>
          </div>
          <div>
            <dt>Start</dt>
            <dd>
              {startMode === 'now'
                ? 'Funding block time'
                : startValue || 'Not set'}
            </dd>
          </div>
          <div>
            <dt>Duration</dt>
            <dd>{duration || '0'} seconds</dd>
          </div>
          <div>
            <dt>Contract</dt>
            <dd>
              {deployment.address
                ? shortHash(deployment.address, 7)
                : 'Not deployed'}
            </dd>
          </div>
          <div>
            <dt>Approval spender</dt>
            <dd>
              {deployment.address
                ? shortHash(deployment.address, 7)
                : 'Not deployed'}
            </dd>
          </div>
          <div>
            <dt>Estimated gas</dt>
            <dd>
              {currentGas && estimatedFeeUsdcUnits !== undefined
                ? `${currentGas.toString()} gas · ≈ ${formatUsdc(estimatedFeeUsdcUnits)} USDC`
                : deployment.mode === 'preview'
                  ? 'Unavailable in preview'
                  : 'Waiting for valid step'}
            </dd>
          </div>
        </dl>
        <details className="review-technical">
          <summary>Technical payment details</summary>
          <div className="hash-preview">
            <span>Reference hash</span>
            <code>{parsed.referenceHash}</code>
            {parsed.invoiceId && (
              <>
                <span>Predicted invoice ID</span>
                <code>{parsed.invoiceId}</code>
              </>
            )}
          </div>
        </details>
        <div className="rights-note">
          <strong>If the payer cancels</strong>
          <p>
            Future vesting stops and unused escrow returns to the payer. Every
            amount already earned remains available to the recipient.
          </p>
        </div>
        {parsed.errors.length > 0 && (
          <div className="form-errors" role="alert">
            <strong>Resolve before funding</strong>
            <ul>
              {parsed.errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        )}
        {!hasBalance && connection.address && (
          <p className="inline-warning">
            Insufficient ERC-20 USDC balance for this deposit.
          </p>
        )}
        {!hasGas && connection.address && (
          <p className="inline-warning">
            Insufficient native Arc USDC for the estimated current-step gas.
          </p>
        )}
        {hasExcessAllowance && connection.address && (
          <p className="inline-warning">
            Existing allowance exceeds this invoice. Replace it with the exact
            amount before funding so no residual authority remains.
          </p>
        )}
        {hasExactAllowance && !hasFundingReserve && connection.address && (
          <p className="inline-warning">
            Balance covers the invoice amount but not the current funding gas
            estimate and principal together.
          </p>
        )}
        {connection.status !== 'connected' && (
          <p className="inline-warning">
            Connect a wallet to prepare approval and funding.
          </p>
        )}
        {deployment.mode === 'deployed' && !deploymentVerification.verified && (
          <p className="inline-warning">
            Contract writes remain locked until deployed bytecode and the USDC
            immutable match the approved release.
          </p>
        )}
        {connection.status === 'connected' &&
          connection.chainId !== ARC_CHAIN_ID && (
            <p className="inline-warning">
              Switch to Arc mainnet before simulation or signing.
            </p>
          )}
        <div className="transaction-steps">
          <button
            className="button button-ghost"
            disabled={
              !ready ||
              hasExactAllowance ||
              !hasGas ||
              approval.isPending ||
              approvalReceipt.isLoading
            }
            onClick={approve}
            type="button"
          >
            <span>1</span>
            {hasExactAllowance
              ? 'Exact allowance available'
              : approvalReceipt.isLoading
                ? 'Approval submitted…'
                : '1. Approve exact amount'}
          </button>
          <button
            className="button button-dark"
            disabled={
              !ready ||
              !hasExactAllowance ||
              !hasBalance ||
              !hasGas ||
              !hasFundingReserve ||
              !simulation.data?.request ||
              funding.isPending ||
              fundingReceipt.isLoading
            }
            onClick={fund}
            type="button"
          >
            <span>2</span>
            {fundingReceipt.isLoading
              ? 'Funding submitted…'
              : '2. Fund payment schedule'}
          </button>
        </div>
        {approval.error && (
          <p className="tx-error">
            Approval was rejected or failed: {approval.error.message}
          </p>
        )}
        {approvalReceipt.error && (
          <p className="tx-error">
            Approval receipt failed: {approvalReceipt.error.message}
          </p>
        )}
        {funding.error && (
          <p className="tx-error">
            Funding was rejected or reverted: {funding.error.message}
          </p>
        )}
        {fundingReceipt.error && (
          <p className="tx-error">
            Funding receipt failed: {fundingReceipt.error.message}
          </p>
        )}
        {replacementNotice && (
          <p className="inline-warning">{replacementNotice}</p>
        )}
        {fundingReceipt.isSuccess && (
          <p className="tx-success">
            Funding receipt confirmed.{' '}
            <a
              href={txUrl(fundingReceipt.data.transactionHash)}
              target="_blank"
              rel="noreferrer"
            >
              View receipt
            </a>
            . Contract state is being refreshed before this invoice is presented
            as funded.
            {parsed.invoiceId && (
              <>
                {' '}
                <Link href={`/invoices/${parsed.invoiceId}`}>Open invoice</Link>
              </>
            )}
          </p>
        )}
        <p className="review-foot">
          No transaction is available until a verified contract address is
          configured. Duelet never requests an unlimited allowance.
        </p>
      </aside>
    </div>
  );
}

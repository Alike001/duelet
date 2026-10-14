# Arc deterministic finality and Duelet event discovery

Date: 2026-10-14

## Scope

Determine whether Duelet's 20-block event-indexing delay is necessary on Arc
mainnet and identify any separate RPC reliability behavior that must remain.
No smart-contract, transaction, or financial behavior is in scope.

## Sources checked

- Arc, "Deterministic Finality":
  <https://docs.arc.io/arc/concepts/deterministic-finality>
- Arc, "Transaction Lifecycle":
  <https://docs.arc.io/integrate/wallets/transaction-lifecycle>
- Arc, "Indexing Events":
  <https://docs.arc.io/integrate/infrastructure/indexing-events>
- Arc, "Exchange Deposits":
  <https://docs.arc.io/integrate/exchanges/deposits>
- Arc, "RPC Endpoints":
  <https://docs.arc.io/arc/references/rpc-endpoints>

All sources are official Arc documentation retrieved on 2026-10-14.

## Verified facts

- A committed Arc block is immediately irreversible; Arc does not have normal
  probabilistic reorgs or an accumulating-confirmations state.
- Arc's event-indexing guide explicitly instructs indexers to skip reorg
  handling and remove confirmation-depth delays.
- A transaction receipt with a block number represents a final transaction.
- The public RPC limits `eth_getLogs` ranges to 10,000 blocks. Duelet retains
  its conservative 9,999-block pagination.
- Load-balanced public RPC backends may briefly disagree at the newest block
  and return `-32014`. Arc documents retrying after a short delay for that
  availability condition; it is not a chain-finality risk.

## Decision

Remove the 20-block delay and index through the latest committed block. Keep
bounded log ranges and normal retry/refetch behavior for transient RPC
availability. The UI remains honest about public-RPC coverage limitations.

## Inferences

- Waiting 20 blocks provided latency without additional settlement security on
  Arc.
- React Query's existing retry/refetch behavior is sufficient for the rare
  near-head backend mismatch; a confirmation delay should not be repurposed as
  an RPC-availability workaround.

## Unknowns

- Public RPC backend synchronization latency is not specified as a hard upper
  bound. A persistent read failure must surface as an error rather than be
  represented as an empty or complete history.

## Not included

- No contract changes.
- No mainnet transaction, signing, or wallet access.
- No claim that the currently undeployed Duelet contract has event history.

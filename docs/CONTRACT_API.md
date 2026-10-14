# DueletStream contract API

Status: Phase 1 implementation, unaudited and not deployed

`DueletStream` is one non-upgradeable escrow contract. It has no owner, proxy,
fee recipient, arbitrary-call function, token rescue, or administrative
withdrawal. On Arc mainnet, its constructor accepts only the official USDC
predeploy at `0x3600000000000000000000000000000000000000`.

## Financial terms

- **Invoice reference**: a nonzero offchain identifier commitment supplied as
  `bytes32 referenceHash`. It identifies the commercial invoice but holds no
  funds.
- **Escrow deposit**: the complete `totalAmount` transferred from the payer into
  the contract during `createAndFund`.
- **Vested funds**: the time-earned portion calculated from immutable start and
  end timestamps, frozen permanently at cancellation.
- **Claimable funds**: vested funds not yet transferred to the payee:
  `vestedAmount - withdrawnAmount`.
- **Refunded funds**: the unvested amount returned atomically to the payer when
  cancellation succeeds.
- **Remaining liability**: unpaid funds still lawfully owed by the contract:
  `totalAmount - withdrawnAmount - refundedAmount`.

## State-changing functions

```solidity
function createAndFund(
    bytes32 referenceHash,
    address payee,
    uint256 totalAmount,
    uint64 requestedStartTime,
    uint64 endTime,
    bytes32 metadataHash
) external returns (bytes32 invoiceId);

function withdraw(bytes32 invoiceId) external returns (uint256 amount);

function cancel(bytes32 invoiceId) external returns (uint256 refund);
```

`requestedStartTime == 0` resolves to the successful transaction timestamp.
Otherwise it must be at least the current timestamp. `withdraw` is
permissionless, claims the complete current amount, and always pays the stored
payee. Only the stored payer may call `cancel`, and only before maturity.
Successful withdrawal and refund paths require exact sender and recipient token
balance deltas; short-paying token behavior reverts atomically.

## Read functions

```solidity
function computeInvoiceId(address payer, bytes32 referenceHash)
    public view returns (bytes32);
function getInvoice(bytes32 invoiceId) external view returns (Invoice memory);
function vestedAmount(bytes32 invoiceId) public view returns (uint256);
function claimableAmount(bytes32 invoiceId) public view returns (uint256);
function refundableAmount(bytes32 invoiceId) public view returns (uint256);
function invoiceLiability(bytes32 invoiceId) public view returns (uint256);
function invoiceStatus(bytes32 invoiceId) external view returns (InvoiceStatus);
function isSolvent() external view returns (bool);
function surplusBalance() external view returns (uint256);
function invoiceExists(bytes32 invoiceId) external view returns (bool);
function totalOutstandingLiability() external view returns (uint256);
function USDC() external view returns (IERC20);
```

`InvoiceStatus` is derived for presentation and is never stored. The values are
`Nonexistent`, `Scheduled`, `Streaming`, `Matured`, `Canceled`, and `Settled`.
Cancellation remains distinguishable even after its frozen payee entitlement
is fully claimed.

## Events

```solidity
event InvoiceCreated(
    bytes32 indexed invoiceId,
    address indexed payer,
    address indexed payee,
    bytes32 referenceHash,
    uint256 totalAmount,
    uint64 startTime,
    uint64 endTime,
    bytes32 metadataHash
);

event FundsWithdrawn(
    bytes32 indexed invoiceId,
    address indexed caller,
    address indexed payee,
    uint256 amount,
    uint256 totalWithdrawn
);

event InvoiceCanceled(
    bytes32 indexed invoiceId,
    address indexed payer,
    address indexed payee,
    uint64 canceledAt,
    uint256 vestedAmount,
    uint256 refundedAmount
);
```

## Direct recovery without the frontend

The frontend is never an authority. A user or third party can read
`claimableAmount(invoiceId)` directly from a trusted Arc RPC and submit
`withdraw(invoiceId)` to the deployed contract with any standard EVM wallet or
CLI. The transfer destination is encoded in contract state, not supplied by the
caller. A payer can likewise submit `cancel(invoiceId)` directly while the
invoice is cancellable. Every successful action is independently reconcilable
from the events and current invoice state.

## Stable invoice identity

The public rebrand does not change the Phase 0 protocol identifier:

```text
keccak256("ARC_INVOICE_STREAM_V1")
```

Keeping the domain stable prevents branding from silently changing deterministic
invoice IDs. IDs remain bound to the domain, chain ID, deployed contract,
payer, and reference hash.

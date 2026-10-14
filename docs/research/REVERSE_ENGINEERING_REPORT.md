# Reverse-engineering verdict

Recommendation: CONDITIONAL GO

Build an Arc-native, noncustodial lending workstation around live Morpho Blue markets and Morpho Vault V2, reconstructing the proven lending mechanics and risk-focused UX of Zona and Peridot.

The product should support the complete financial lifecycle:

- Deposit USDC/EURC into selected lending vaults.
- Supply cirBTC or WETH collateral.
- Borrow USDC/EURC against isolated collateral.
- Repay debt and withdraw collateral atomically.
- Redeem vault shares, including honest handling of limited exit liquidity.
- Simulate every transaction and show post-transaction liquidation risk.
- Monitor positions and notify users before liquidation.
- Reconstruct all positions directly from Arc state.
- Optionally add a tightly bounded, opt-in repay-reserve keeper after audit.

This is viable because Arc already has live Morpho markets, Vault V2 deployments, substantial deposits, official transaction-building infrastructure, price-oracle integrations, and suitable assets.

It is conditional because:

1. Arc does not currently have verified ordinary-user tokenized equities comparable to Zona.
2. Uniswap V4 contracts exist, but meaningful liquid pools were not established by this review.
3. No sufficiently verified Arc perpetual-market stack exists for Atoma’s strategy.
4. A custom keeper contract cannot responsibly be designed, audited, and deployed by the October 14 deadline.
5. The local development volume is currently at its disk quota and must be resolved before creating the separate repository.
6. Mainnet deployment and any fund-moving validation still require explicit approval.

The existing programmable-obligations repository remains clean and unchanged at commit b845dfa.

———

# 1. Executive summary of the six products

| Product   | Actual financial operation                                                                            | Strongest reusable mechanism                                                                                      | Arc conclusion                                                                                      |
| --------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Zona      | Isolated overcollateralized loans against tokenized equities; USDG lenders earn borrower interest     | Goal-first lending UX, asset-specific risk gates, separation of borrowing availability from liquidation/repayment | Core lending model is supported; tokenized-stock version is blocked                                 |
| Peridot   | Compound V2-derived pooled lending with pTokens, interest indexes, collateral factors and liquidation | Complete supply → receipt token → collateral → borrow → repay → redeem lifecycle                                  | Mechanically supported, but better implemented through deployed Morpho/Aave than a new lending pool |
| Aqua0     | Shared liquidity commitments backing multiple strategies, with JIT vault settlement                   | Actual-versus-virtual balance separation and bounded strategy authorization                                       | Arc testnet work already exists; mainnet deployment and liquidity remain unverified                 |
| Lockgate  | Secondary liquidity/early exit for accepted tokenized-credit redemptions                              | Multi-party sale commitment and atomic deed/payment settlement                                                    | Blocked by legal issuer, redemption-agent and buyer-liquidity dependencies                          |
| AutoRange | Isolated noncustodial Uniswap V3 LP vault with a bounded keeper                                       | Owner/operator separation, cooldowns, price bounds, emergency exit                                                | Control model is valuable; LP product itself is blocked by v3/v4 mismatch, liquidity and license    |
| Atoma     | Custodial, delta-neutral USDC strategy using offchain perpetual accounts                              | Epoch withdrawal accounting, high-water-mark fees, bounded NAV updates                                            | Blocked by missing verified Arc perp infrastructure and undesirable custody/oracle trust            |

The strongest coherent combination is:

- Zona/Peridot: the financial lifecycle.
- Morpho Blue/Vault V2: the actual Arc execution layer.
- AutoRange: only the bounded-operator design pattern for a later repay-only safety module.
- Zona: the position-risk and “what can I do right now?” UX.
- Peridot Agent Kit: simulation-first, user-signed transaction preparation, without requiring AI.

———

# 2. Verified repositories and deployments

## Zona Finance

No original public source repository or reusable license was located.

Officially documented Robinhood Chain contracts include:

- Pool: 0xc07d049859642b299E75bc85Aa4752653F8380c1
- Pool address provider: 0x06fBAAf050E3a7EB7A9A22C1306456224BCE3b51
- Additional configurator, oracle, data-provider and access-control contracts are published in the Zona contract registry.

The documentation identifies seven equity/ETF collateral assets and USDG as the sole borrowable asset. Zona’s overview and oracle rules provide substantially better implementation evidence than the marketing site.

## Peridot Finance

Public repositories:

- peridot-contracts-2-5
- peridot-agent-kit

Published mainnet controller deployments include:

- BNB Chain Peridottroller: 0x6fC0c15531CB5901ac72aB3CFCd9dF6E99552e14
- Monad Peridottroller: 0x6D208789f0a978aF789A3C8Ba515749598940716

Core code paths include:

- contracts/contracts/PErc20.sol
- contracts/contracts/PToken.sol
- contracts/contracts/Peridottroller.sol
- interest-rate models, liquidation hooks, margin accounts and protocol adapters.

No Arc deployment is published.

## Aqua0

Public organization and repositories:

- Aqua0-fi organization
- aqua0-ethglobal
- app-hookathon
- avax-aqua0

The public Arc-oriented repository targets Arc testnet, chain ID 5042002. It includes interfaces and adapters around AssetVault, VaultRegistry, 1inch Aqua/SwapVM and market-maker execution. It does not establish a verified Arc mainnet production deployment of the complete Aqua0 system.

## Lockgate Finance

- Official product site

No public repository, verified production-address registry, audit package or independently attributable transaction set was located. Contract behavior beyond the public workflow must therefore be treated as unverified.

## AutoRange

- autorange-contracts

Published Arbitrum addresses:

- Configuration: 0xa618…a0c5
- Factory: 0x288B…6502
- Implementation: 0xB229…99BA

The repository contains the vault/factory implementation and tests, including operator revocation, pause, fee accounting, emergency paths, fork tests and Halmos properties.

## Atoma

- atoma-vault
- Arbitrum proxy: 0xCC56410e1a136aF0eCEb7241c6aE394F4d8b581c

The repository explicitly describes the vault as actively managed and custodial. The owner moves USDC to an offchain trading wallet and an operator reports PnL back to the vault. The project also explicitly states it has not yet been audited.

———

# 3. Technical reverse engineering

## Zona Finance

### Product and accounting

There are two user roles:

- USDG supplier: deposits USDG, receives interest-bearing zUSDG, earns borrower interest and exits subject to pool liquidity.
- Borrower: supplies one isolated tokenized equity, enables it as collateral, and borrows USDG.

Debt accrues continuously. Borrowing capacity comes from collateral value, asset LTV, isolation ceilings, available USDG and account health.

### State transitions

approve collateral
→ supply
→ receive zToken
→ enable as collateral
→ borrow USDG
→ debt accrues
→ repay partially or fully
→ disable/withdraw collateral

Liquidation becomes permissionless below health factor 1. A liquidator repays USDG debt and receives collateral plus a liquidation bonus. Zona’s liquidation documentation also recognizes gap risk and potential bad debt rather than implying overcollateralization is a guarantee.

### Risk architecture

Zona’s strongest design is the separation of:

- Collateral valuation
- Permission to open new debt
- Permission to repay
- Permission to liquidate

New borrowing is gated by a trading calendar, reporter liveness, issuer state, price freshness and USDG peg checks. Repayment remains possible during many borrow closures. Liquidation can continue outside borrowing hours when valuation remains valid. This is an excellent failure-mode design.

### UX

The interface is understandable because users first choose a goal:

- Borrow against stock.
- Earn on USDG.

The borrow preview shows projected health rather than only a maximum amount. The documentation explicitly explains what remains possible when a price or borrow gate fails.

### Evidence caveat

The architecture and addresses are documented, but without public source or a verified audit corpus the implementation cannot be safely copied or independently confirmed at source level.

———

## Peridot Finance

### Core lending mechanism

Peridot is recognizably Compound V2-derived:

- PErc20.mint() transfers underlying into the market.
- PToken.mintFresh() mints pTokens from the current exchange rate.
- redeem() or redeemUnderlying() burns pTokens and releases underlying.
- borrow() records principal against the current borrow index.
- repayBorrow() transfers underlying in and reduces borrow balance.
- liquidateBorrow() repays unhealthy debt and invokes collateral seizure.
- Peridottroller checks market membership, liquidity, collateral factors, caps and oracle values.

The interest path is:

utilization
→ interest-rate model
→ per-block borrow rate
→ accrueInterest()
→ borrow index and reserves update
→ supplier exchange rate rises

### Authority and failure behavior

The controller can list markets and change risk parameters through its governance/admin structure. The Unitroller/delegator model introduces upgrade authority. Borrow, redeem and transfer hooks revert if the resulting account would be undercollateralized.

### Extended mechanisms

The repository also contains:

- Cross-chain token adapters
- Margin accounts
- PancakeSwap adapters
- Dual-investment products
- Boosted vault strategies
- Bots and price updaters

These are not part of the minimal Compound lending kernel and should not be imported into the Arc product simply because they exist.

### Agent kit

The agent kit prepares transactions and simulations; it does not need to hold a user’s private key. The useful pattern is:

interpret action
→ fetch position
→ validate preconditions
→ simulate
→ build calldata
→ user signs

That is appropriate for a professional frontend even without an AI interface.

### UX

Peridot provides broad market navigation and beginner descriptions but exposes a larger, more difficult product surface than Zona. Its best contribution is simulation-first preparation and a single view of lending positions.

### Audit caveat

Peridot’s audit page links Halborn and an independent report. Other marketing references are not consistently reflected there. Only the reports actually linked from the audit page should be claimed.

———

## Aqua0

### Financial operation

Aqua0 lets liquidity providers place actual assets in vaults while strategies receive virtual allocations representing permitted use of that liquidity.

A strategy trade follows roughly:

strategy has virtual allocation
→ output asset requested
→ vault transfers actual output JIT
→ swap executes
→ received input is swept back into vault
→ LP and strategy accounting update

This is intended to let the same principal support more than one market-making venue without permanently fragmenting capital.

### Authority model

The reviewed repositories separate:

- LP-owned funds in asset vaults
- Strategy authorization
- Market-maker/keeper execution
- Virtual balance accounting
- Actual vault outflows

Keeper limits include budgets, cooldowns and trade restrictions. Strategy registration requires stronger authority than ordinary execution.

### Fees and inventory

The official product materials describe fee sharing, with 80% to LPs and 20% to Aqua0. Market makers remain exposed to inventory, pricing, venue and adverse-selection risk; virtual accounting does not remove the requirement that actual vault assets be available at settlement.

### Arc status

The examined Arc repository uses:

- Arc testnet
- Demo assets
- 1inch Aqua/SwapVM integration
- Vault and router adapters
- Circle wallet-based keeper machinery

The demo tokens are not evidence of real stablecoin issuer markets or mainnet liquidity. Because Aqua0 already has explicit Arc work, reproducing that testnet integration would neither be novel nor establish a missing financial capability.

———

## Lockgate Finance

### Observed product workflow

The public interface describes a tokenized-credit early-exit market:

1. A fund accepts a redemption and fixes an amount.
2. A holder offers that accepted claim.
3. A buyer purchases the future redemption at a discount.
4. Holder, buyer and operator acknowledge common terms.
5. A redemption deed and stablecoin consideration settle atomically.
6. The eventual administrator payment follows the deed holder.

The buyer appears to take administrator/default and timing risk, while the seller receives earlier liquidity at a discount.

### Permission and settlement model

The interface refers to restricted transfers, document commitments and distinct holder/buyer/operator/administrator roles. This is economically closer to assignment of a receivable than to permissionless AMM trading.

### Evidence boundary

No public contract source or verified deployment could be found. Accordingly:

- Contract names: unavailable.
- Actual discount formula: unavailable.
- Queue priority enforcement: unavailable.
- Deed enforceability: unavailable.
- Recovery/default behavior: unavailable.
- Onchain transaction proof: unavailable.

The workflow is plausible, but most of its implementation remains inference.

### Arc suitability

A faithful implementation would require more than contracts:

- A recognized tokenized-credit issuer.
- An administrator acknowledging claim assignment.
- Legal/KYC restrictions.
- A trusted claim-status attestation.
- Buyers prepared to fund exits.
- Default and dispute procedures.

Those dependencies are not presently verified on Arc.

———

## AutoRange

### Contract model

Each vault owns one Uniswap V3 concentrated-liquidity position. A factory creates isolated EIP-1167 vault clones.

The owner controls:

- Deposits and withdrawals
- Target ranges
- Risk parameters
- Operator appointment/revocation
- Emergency exit
- Rescue and pause behavior

The operator can:

- Reposition liquidity
- Collect and compound fees
- Sweep within configured rules

It cannot freely withdraw principal or redefine owner guardrails.

### Rebalance lifecycle

owner funds vault
→ vault mints V3 NFT position
→ price leaves configured range
→ cooldown and price checks pass
→ operator removes liquidity
→ optional bounded swap
→ new range is minted
→ fees/accounting update

This is a strong authorization pattern: automation has enough authority to maintain a position but not arbitrary control over the user’s assets.

### Failure and recovery

Important controls include:

- Cooldowns
- Rebalance-count limits
- Price bounds
- Slippage checks
- Pause
- Operator revocation
- Owner emergency withdrawal

### Arc limitation

AutoRange targets Uniswap V3. Arc’s official deployment is Uniswap V4, whose singleton PoolManager, hooks and position-management model differ materially. This is not a mechanical chain port.

More importantly, deployed contracts do not imply useful pools. The official Uniswap Arc explore surface did not establish deep, active pools during this review. A range-management vault without real volume and exit liquidity would be a shell.

———

## Atoma

### Product and trust model

Atoma accepts USDC and mints ERC-4626-style shares, but synchronous ERC-4626 withdrawal and redemption are deliberately disabled.

The owner can transfer idle USDC to an offchain trading wallet. The advertised strategy holds opposing perpetual positions and attempts to capture funding-rate differences.

An operator periodically reports PnL:

reported delta
→ bounded/rate-limited NAV update
→ total managed assets changes
→ share price changes

There is no onchain oracle for the offchain trading account.

### Withdrawal lifecycle

requestWithdrawal(shares)
→ shares escrow for next epoch
→ operator settles epoch
→ escrowed shares burn
→ liability reserved
→ user claims when idle USDC is available

If assets later fall below settled liabilities, a ratcheting index applies pro-rata haircuts instead of letting early claimants drain the vault.

### Fees

The repository documents:

- 20% performance fee above a high-water mark.
- 0.5% withdrawal fee.
- No management fee.
- Operator fee-share ownership.

### Risks

- Owner custody of deployed trading capital.
- Operator-reported NAV.
- Venue insolvency/liquidation risk.
- Withdrawal timing and idle-liquidity risk.
- UUPS upgrade authority.
- No completed audit.

The public app currently does not provide evidence that advertised historical yields have been achieved. Yield claims should not be imported into an Arc product.

———

# 4. Financial-mechanics comparison

| Mechanism | Accounting unit                             | Yield source                               | User exit                                          | Principal risks                                             |
| --------- | ------------------------------------------- | ------------------------------------------ | -------------------------------------------------- | ----------------------------------------------------------- |
| Zona      | zToken supply balance; indexed debt         | Borrower interest                          | Withdraw if liquidity/health permits               | Liquidation, oracle gaps, issuer controls, pool illiquidity |
| Peridot   | pToken exchange rate and borrow index       | Borrower interest                          | Redeem pTokens subject to cash/liquidity           | Oracle/admin risk, bad debt, utilization                    |
| Aqua0     | Vault assets plus strategy virtual balances | Market-making fees                         | Withdraw actual vault claim subject to allocations | Strategy loss, inventory, JIT settlement                    |
| Lockgate  | Assigned redemption claim                   | Discount between sale price and redemption | Buyer waits for redemption settlement              | Default, delay, legal/administrator risk                    |
| AutoRange | One isolated CL position                    | AMM trading fees                           | Owner removes liquidity                            | Impermanent loss, price movement, keeper/slippage           |
| Atoma     | Operator-reported managed assets and shares | Perp funding spread                        | Epoch request and later claim                      | Custody, reported NAV, venue liquidation, shortfall         |

Only the Zona/Peridot lending lifecycle presently maps cleanly onto verified Arc infrastructure without inventing a critical missing subsystem.

———

# 5. UX comparison

| Product   | Strong UX pattern                                                              | Weakness to avoid                                                                  |
| --------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Zona      | Goal-first entry, projected health factor, action availability during failures | Complex asset/oracle gates can overwhelm without progressive disclosure            |
| Peridot   | Unified market/position navigation and transaction preparation                 | Too many unrelated products compete for attention                                  |
| Aqua0     | Visual explanation of actual versus virtual liquidity                          | System is difficult to understand without exposing settlement constraints          |
| Lockgate  | A chronological proof/claim-settlement story                                   | Legal and permission states are not independently verifiable from public materials |
| AutoRange | Explicit guardrails, operator scope and emergency exit                         | Advanced LP parameters are not beginner-friendly                                   |
| Atoma     | Simple mint/hold/redeem story and strategy allocation                          | “Redeem anytime” language conflicts with epoch-based contract reality              |

The recommended UX should combine Zona’s clarity with AutoRange’s visible permissions and Peridot’s simulation-first execution.

———

# 6. Arc mainnet capability matrix

Research snapshot: October 13, 2026.

| Capability             | Status                          | Evidence and conclusion                                                                                                                                                |
| ---------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Arc mainnet            | SUPPORTED                       | Chain ID 5042, RPC https://rpc.mainnet.arc.io, explorer https://explorer.arc.io. Arc RPC reference                                                                     |
| USDC                   | SUPPORTED                       | 0x3600000000000000000000000000000000000000; ERC-20 accounting uses 6 decimals                                                                                          |
| EURC                   | SUPPORTED                       | 0xbEf5f6d51CB62b58e6A8f77868681825C6fe21c1; 6 decimals                                                                                                                 |
| cirBTC                 | SUPPORTED WITH ADAPTATION       | 0x171A4217b86A807A64eB94757Db6849fb4bDbAA0; issuer/bridge and admin risks must be disclosed                                                                            |
| WETH                   | SUPPORTED                       | 0x128cC466B61f542da60c70e3aA11c10e19B84EDB                                                                                                                             |
| USYC                   | PERMISSIONED                    | 0x8a5D989Bbb96929F689B0200f435f53dA42bF490; eligibility and minimums apply                                                                                             |
| Tokenized equities     | UNVERIFIED / UNAVAILABLE        | No supported, liquid, ordinary-user stock-token set equivalent to Zona was established                                                                                 |
| Morpho Blue            | SUPPORTED                       | Core 0x34CD04070dD72b14E241112F6d83812Df5Af7fCD; official addresses and source are published                                                                           |
| Morpho Vault V2        | SUPPORTED                       | Factory 0x3b0eefaBfa22ec7CF2c73877ac16e78D76749f12; multiple listed Arc vaults                                                                                         |
| Morpho bundles         | SUPPORTED                       | VaultBundles 0x76c1…0b68, VaultExitBundles 0x2095…49C7, BlueBundles 0x3c4B…4A7F. Morpho address registry                                                               |
| Aave V4                | SUPPORTED, LIQUIDITY UNVERIFIED | Activated September 16, with USDC, EURC, cirBTC and WETH. Activation notice                                                                                            |
| Uniswap V4 contracts   | SUPPORTED                       | PoolManager 0x8366…0951, PositionManager 0x6049…f82B. Uniswap deployments                                                                                              |
| Deep Uniswap markets   | UNVERIFIED                      | Contract deployment was verified; meaningful pool depth and volume were not                                                                                            |
| Chainlink price feeds  | SUPPORTED                       | Aave’s Arc registry includes USDC, EURC, BTC and ETH feeds. Aave Arc address book                                                                                      |
| Arc-native perpetuals  | UNVERIFIED                      | Extended is described as “coming to Arc”; no current venue with verified depth and lifecycle was established                                                           |
| Hosted keeper network  | UNVERIFIED                      | No production Arc automation service was verified strongly enough to be a safety dependency                                                                            |
| Multicall3From         | SUPPORTED                       | 0x522fAf9A91c41c443c66765030741e4AaCe147D0; EOA-oriented original-sender batching                                                                                      |
| Circle Borrow Kit      | SUPPORTED WITH ADAPTATION       | Provides Arc collateralized-loan workflows, health monitoring and atomic composition; underlying protocol abstraction must not replace direct verification. Borrow Kit |
| Circle Earn Kit        | SUPPORTED WITH ADAPTATION       | Connects applications to Morpho vaults; use as an adapter, not the financial source of truth                                                                           |
| CCTP/Gateway/Wallets   | SUPPORTED, OPTIONAL             | Useful for onboarding and cross-chain USDC, but not needed for core lending accounting                                                                                 |
| Deterministic finality | SUPPORTED                       | Suitable for immediate confirmed-state UX                                                                                                                              |
| Gas                    | SUPPORTED WITH SPECIAL HANDLING | Native USDC uses 18-decimal value semantics while ERC-20 USDC uses 6 decimals. EVM differences                                                                         |

Read-only RPC verification at block 25,693,646 found deployed bytecode at the documented token, Aave, Morpho, bundle, Uniswap and Multicall addresses. The gas-price response was approximately 20 Gwei. No transaction was signed or broadcast.

———

# 7. Current liquidity and dependency analysis

## Morpho

The official Morpho Arc dashboard reported approximately:

- Total deposits: $511.7M
- Outstanding loans: $195.3M
- TVL: $316.2M
- Total supply: $196.4M
- Vault V2 assets under curation: $170.6M

Listed Arc markets include:

- cirBTC/USDC
- cirBTC/EURC
- WETH/USDC
- WETH/EURC
- sUSDai/USDC
- syrupUSDC/USDC
- PST/USDC

The principal cirBTC/USDC market had meaningful supplied capital and roughly $985k of immediate unused USDC in the direct API snapshot. Several smaller markets were effectively fully utilized. That distinction matters:

> Deposits or TVL are not the same as withdrawable or borrowable liquidity.

Vaults from Gauntlet, Steakhouse, Galaxy, Keyrock, Dialectic, Bitwise, KPK and others were listed. Several vaults share exposure to the same underlying markets, so their displayed withdrawable liquidity must not be summed as independent liquidity.

## Aave

Aave V4 is confirmed active and operational on Arc:

- Core Hub: 0x17288dfc86205301064577b98B02b81017e6F79C
- Main Spoke: 0xB843bdC3a87A05E77E07Df9FE48928b3A34b134d
- Forex Spoke: 0x4164EBCAF74670aa74C8D4F59de6157c0780F1bB

The technical assessment documents Arc finality, permissioned validators, oracle coverage and token-admin risks. I did not establish enough live reserve-level liquidity evidence to prefer Aave over Morpho for the first implementation.

## Uniswap

Uniswap V4 is deployed, but current Arc liquidity and volume were not sufficient to justify an automated LP product. A tiny visible pool is not a reliable basis for:

- Rebalancing profitability
- Tight slippage bounds
- Keeper economics
- Emergency exits
- Sustainable fee revenue

## Perpetuals

The ecosystem contains announcements, but no Arc-native perpetual venue with verified:

- Production contracts
- Open deposits and withdrawals
- Sufficient depth
- Funding history
- Liquidation mechanics
- Programmatic position proof

was established. This blocks an Atoma-style strategy.

———

# 8. Licensing and reuse matrix

| Project                 | Observed license                                                                    | Reuse decision                                                                                    |
| ----------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Zona                    | No public source/license located                                                    | Do not copy; use documented concepts only                                                         |
| Peridot contracts       | README references Compound/BSD origins, but no repository-wide LICENSE was found    | Treat as no clear grant; use concepts or independently licensed Compound/Morpho code              |
| Peridot agent kit       | No repository-wide license located                                                  | Architecture concepts only                                                                        |
| Aqua0 public repository | MIT                                                                                 | Reusable with notice, but substantial production components are absent                            |
| Lockgate                | No public source/license located                                                    | No code reuse                                                                                     |
| AutoRange               | Business Source License 1.1, no production Additional Use Grant, conversion in 2029 | Do not copy or port into a mainnet product without a commercial license; clean-room concepts only |
| Atoma                   | MIT                                                                                 | Legally reusable with notice, but architecture is not recommended                                 |
| Morpho SDKs             | MIT                                                                                 | Appropriate integration dependency                                                                |
| Morpho Blue core        | GPL-2.0-or-later                                                                    | Integrate deployed protocol; do not casually fork into a proprietary product                      |
| Uniswap V4              | Check component-specific licenses                                                   | Integration is feasible; copying hooks/periphery requires file-level license review               |

———

# 9. Security risks by architecture

## Lending workstation

- Liquidation from collateral price movement.
- Oracle staleness or adapter failure.
- Near-total utilization preventing borrowing or withdrawal.
- Vault curator and allocation risk.
- Stablecoin freeze/upgrade risk.
- cirBTC issuer or bridge risk.
- Malicious or compromised RPC responses.
- Incorrect allowance target.
- Transaction simulation differing from execution state.
- Arc native-USDC versus ERC-20-USDC decimal confusion.
- SDK supply-chain compromise.
- False aggregation of shared vault liquidity.

Mitigations:

- Direct contract reads at transaction time.
- Exact chain and contract allowlists.
- Post-action health buffer, not merely LLTV compliance.
- Pinned and audited SDK versions.
- Simulation with explicit balance-delta checks.
- Exact approvals or permit-based funding.
- Oracle age and market-liquidity display.
- Clear exit-liquidity disclosure.

## Automated LP vault

Additional risks include price manipulation, impermanent loss, hook behavior, keeper front-running, adverse selection and unavailable exit liquidity. Current evidence does not support deployment.

## Shared-liquidity strategy

Virtual allocation can overstate usable capital unless every vault outflow and strategy liability is strictly bounded. Strategy compromise could create cross-market loss contagion.

## Tokenized-credit exit market

Legal assignment, administrator recognition, claim authenticity, fraud, default and sanctions/KYC failures dominate contract risk.

## Market-neutral perp vault

Venue insolvency, basis divergence, liquidation, custody loss, false NAV and delayed withdrawals dominate. Onchain share math cannot remove these risks.

———

# 10. Recommended architecture

## Financial product

A professional Arc lending interface with two related modes:

### Earn

Deposit USDC or EURC into explicitly selected Morpho Vault V2 vaults.

The user receives vault shares. Yield comes only from the underlying lending allocations, net of curator/vault fees. Exit uses redeem/withdraw and is constrained by actual available liquidity.

### Borrow

Supply cirBTC or WETH into an isolated Morpho Blue market and borrow USDC or EURC.

The interface shows:

- Collateral value
- Debt and accrued interest
- LLTV
- Current LTV
- Health buffer
- Liquidation price
- Borrowable liquidity
- Oracle source and freshness
- Exact effect of the proposed action

This is one coherent product: capital supply and overcollateralized borrowing in the same lending ecosystem.

## Optional later safety automation

After audit, add an opt-in repay reserve inspired by AutoRange’s bounded operator model:

RepayReserveFactory
└── RepayReserve clone per borrower/market
├── immutable borrower
├── immutable Morpho market
├── immutable loan asset
├── health trigger
├── target health
├── maximum repay per execution
├── cooldown
├── expiry
└── authorized keeper

Keeper authority must be limited to reducing debt. It must not:

- Borrow
- Withdraw collateral
- Change a recipient
- Swap arbitrarily
- Increase allowance without bounds
- Transfer reserve funds elsewhere

The owner must be able to pause, revoke and withdraw unused reserve funds.

This module should not be part of the rushed microgrant deployment.

———

# 11. Exact reference-to-Arc mapping

| Reference mechanism                        | Arc implementation                                                            | Classification            |
| ------------------------------------------ | ----------------------------------------------------------------------------- | ------------------------- |
| Zona isolated collateral market            | Morpho isolated market tuple: loan token, collateral token, oracle, IRM, LLTV | SUPPORTED                 |
| Zona lender receipt                        | Morpho Blue supply shares or Vault V2 shares                                  | SUPPORTED                 |
| Zona health factor and liquidation preview | Morpho position math plus oracle/LLTV reads                                   | SUPPORTED                 |
| Zona tokenized stocks                      | cirBTC/WETH collateral initially                                              | SUPPORTED WITH ADAPTATION |
| Peridot pToken lifecycle                   | Morpho supply shares and vault shares                                         | SUPPORTED WITH ADAPTATION |
| Peridot borrow/repay/redeem                | Morpho Blue/Bundles actions                                                   | SUPPORTED                 |
| Peridot transaction agent                  | Deterministic transaction builder and simulator                               | SUPPORTED                 |
| AutoRange bounded operator                 | Future repay-only reserve contract                                            | SUPPORTED WITH ADAPTATION |
| Aqua0 virtual shared balances              | Not required for this product                                                 | BLOCKED / EXCLUDED        |
| Lockgate redemption claims                 | No adequate issuer/administrator infrastructure                               | BLOCKED                   |
| Atoma perp hedge                           | No verified Arc perp dependency                                               | BLOCKED                   |

———

# 12. Full proposed product scope

This is not merely a market table.

## Market discovery

- Morpho Blue isolated markets.
- Morpho Vault V2 earn products.
- Asset, oracle, LLTV, utilization and available-liquidity filters.
- Curator and vault allocation disclosure.
- “Why this market?” and “How can I exit?” panels.

## Complete earn lifecycle

- USDC/EURC balance.
- Exact approval or supported permit.
- Vault deposit preview.
- Shares received.
- Current assets, APY source and fees.
- Withdraw, redeem and supported force-exit paths.
- Honest insufficient-liquidity state.

## Complete borrow lifecycle

- Supply collateral.
- Supply-and-borrow atomic action.
- Partial repay.
- Full repay.
- Repay-and-withdraw atomically.
- Add or remove collateral.
- Liquidation threshold and liquidation-price simulation.

## Position operations

- Portfolio-level and market-level views.
- Before/after state for every write.
- Pending, confirmed and rejected transaction states.
- Onchain activity with explorer links.
- Risk alerts.
- Explicit stale-data indicator.
- Recovery path if the application backend is unavailable.

## Advanced mode

- Market ID and complete parameters.
- Oracle and IRM addresses.
- Raw shares/assets/debt.
- Calldata target and function.
- Approval/authorization requirements.
- Simulation trace and expected balance deltas.
- Direct explorer and source links.

## Explicit exclusions

- No protocol token.
- No fabricated APY.
- No hidden routing fee.
- No proprietary pooled vault in the first release.
- No leveraged looping.
- No cross-chain collateral.
- No perps.
- No tokenized equities until real Arc infrastructure exists.
- No keeper control before a focused audit.

———

# 13. What is viable now versus blocked

## Viable now

- Read-only Arc/Morpho market explorer.
- Real vault discovery.
- Wallet position reconstruction.
- Vault deposits and redemptions.
- Collateral supply.
- Borrow, repay and collateral withdrawal.
- Morpho bundle-based atomic workflows.
- Transaction simulation and balance-delta previews.
- Real health and liquidation calculations.
- Explorer-linked activity.
- Mainnet canary transactions with small approved amounts.

## Viable after additional security work

- Self-hosted position alerts.
- Redundant RPC/indexing.
- Bounded automatic repayment.
- Aave as a second lending venue.
- Circle Earn/Borrow Kit as optional orchestration adapters.

## Blocked or unverified

- Zona-style tokenized-stock lending.
- AutoRange-style production AMM vault.
- Aqua0 reproduction.
- Lockgate-style credit exits.
- Atoma-style market-neutral vault.
- Any reliance on announced but not live perpetual infrastructure.
- Any claim of guaranteed or fixed yield.

———

# 14. Smart-contract architecture

## Initial production architecture

No new asset-holding contract is necessary for the first release.

User wallet
├── Morpho VaultBundlesV1
│ └── Morpho Vault V2
└── Morpho BlueBundlesV1
└── Morpho Blue
├── isolated market
├── oracle
└── interest-rate model

Relevant Arc addresses:

- Morpho Blue: 0x34CD04070dD72b14E241112F6d83812Df5Af7fCD
- Vault V2 Factory: 0x3b0eefaBfa22ec7CF2c73877ac16e78D76749f12
- VaultBundlesV1: 0x76c1dEefAe48523E14903085081Bda2999450b68
- VaultExitBundlesV1: 0x2095B5974101A94B726593f0E81d177B058849C7
- BlueBundlesV1: 0x3c4BaE2a2Ef708ddaAE40A0b66623afE44eF4A7F

The Morpho SDK architecture documents atomic supply/borrow and repay/withdraw routes, authorization, refunds and share-price protection.

## Later optional contracts

- RepayReserveFactory
- RepayReserve

These must be isolated per user/market, non-upgradeable unless a compelling recovery design proves otherwise, and tested against keeper compromise, stale oracles, reentrancy, token freezes and partial repayment.

———

# 15. Offchain and keeper architecture

## Data services

- Arc RPC as the authoritative state source.
- Event indexer for user-relevant Morpho, vault and token events.
- Morpho API used for discovery/cache, never as final transaction authority.
- Periodic onchain reconciliation.
- Versioned address/market manifest.
- Market and oracle-health snapshots.
- Notification service for configurable health thresholds.

## Transaction preparation

load current chain state
→ construct action with official SDK
→ resolve approval/permit/authorization
→ simulate against current block
→ calculate token and position deltas
→ present complete preview
→ user signs
→ verify receipt and post-state

## Keeper

For alerts, no wallet authority is necessary.

For later automatic repayment:

- Redundant self-hosted keeper instances.
- Every execution independently reconstructs health.
- Onchain contract rechecks all limits.
- Keeper cannot withdraw or redirect value.
- Missed execution is an explicit possibility, not a guarantee.

———

# 16. Frontend information architecture

/
├── /markets
│ ├── /markets/earn
│ ├── /markets/borrow
│ └── /markets/[marketId]
├── /positions
│ └── /positions/[marketId]
├── /activity
├── /risk
└── /settings

Core navigation:

- Markets
- Earn
- Borrow
- Positions
- Activity

Each position detail page should include:

- Position summary
- Collateral and debt
- Health timeline
- Liquidation price
- Interest and utilization
- Oracle status
- Available actions
- Complete exit
- Advanced onchain proof

Beginner and advanced modes should change information density, not financial behavior.

———

# 17. Landing-page design specification

The visual direction should be an institutional market workstation rather than a neon crypto dashboard.

## Hero

Use a real interactive position preview:

Deposit: 0.25 cirBTC
Borrow: 10,000 USDC
Current LTV: …
Liquidation LTV: 86%
Liquidation price: …
Available market liquidity: …

Every displayed value must come from current chain data or be clearly labeled as an illustrative input.

The first screen must answer:

1. What can I do?
2. Where does yield/liquidity come from?
3. What can make me lose money?
4. Can I get out?

## Visual system

- Off-white or restrained dark-neutral canvas.
- Dense but legible financial typography.
- One functional accent color for safe actions.
- Amber/red reserved for risk states.
- No invented TVL counters.
- No decorative network globe.
- No generic glowing token or AI artwork.

## Page structure

1. Live position simulator.
2. Earn and borrow paths.
3. Real listed markets with timestamped data.
4. How supply, borrow, repay and exit work.
5. Risk architecture.
6. Transaction simulation demonstration.
7. Onchain addresses and source verification.
8. Documentation and disclosures.

Mobile should prioritize position health and defensive actions above charts.

———

# 18. Test and security strategy

## Deterministic tests

- Fixed-point interest and position calculations.
- Asset-decimal conversions.
- Native USDC versus ERC-20 USDC handling.
- Liquidation price and health-buffer calculations.
- Approval and authorization targets.
- Market ID derivation.
- Vault share previews.
- Transaction preview balance deltas.

## Arc fork tests

At pinned mainnet blocks:

- Vault deposit and redeem.
- Insufficient-liquidity withdrawal failure.
- Collateral supply and borrow.
- Partial repayment.
- Full repay and withdraw.
- Health check after price change.
- Rejection above safe LTV.
- Expired deadline.
- Wrong market/address/chain.
- Exact allowance consumption.
- Stablecoin pause/freeze behavior where simulatable.

## Frontend/integration tests

- Stale RPC.
- Morpho API unavailable.
- Wallet rejection.
- Simulation succeeds but state changes before execution.
- Insufficient USDC for gas.
- Wrong network.
- Unsupported smart wallet.
- Mobile transaction review.
- Backend missing while direct chain reads remain functional.

## Optional keeper invariants

- Keeper can never increase debt.
- Keeper can never withdraw collateral.
- Keeper can never transfer to itself.
- Total repayment cannot exceed configured reserve or debt.
- Paused/expired/revoked reserve cannot execute.
- Failed repayment cannot consume accounting state.
- Owner can always recover idle assets subject to a currently executing call.

———

# 19. Mainnet deployment and recovery strategy

## Before deployment

- Resolve local disk capacity without deleting the existing project.
- Create a separate repository and directory.
- Freeze a versioned Arc address manifest from official sources.
- Pin SDK versions and lockfile.
- Verify deployed bytecode at every target.
- Select a small, explicit set of markets.
- Perform a pinned-block Arc fork test.
- Obtain independent review for any custom contract.

## Mainnet canary

With explicit approval:

1. Deploy only non-financial metadata infrastructure, if any.
2. Connect to existing Morpho contracts.
3. Perform a minimal USDC vault deposit and redeem.
4. Perform a minimal collateral supply, borrow, repay and withdrawal.
5. Verify all balance deltas and explorer receipts.
6. Publish exact transaction hashes and supported-market manifest.

No broad public launch should occur until both exit paths have been demonstrated.

## Recovery

- Users retain direct access to Morpho and vault contracts if the frontend fails.
- No application-admin custody.
- Frontend can disable new actions without blocking direct user exits.
- Market manifest is versioned and signed.
- Backend state is rebuilt from chain.
- Compromised RPC is handled through multiple providers and result comparison.
- A broken release is rolled back at the frontend/configuration layer, not by mutating users’ positions.

———

# 20. Phased implementation plan

## Phase 0 — Evidence freeze and repository setup

- Create a new repository outside the obligations project.
- Record official Arc/Morpho/Aave/Uniswap addresses.
- Add market-support policy.
- Add risk register and quality gates.
- Resolve disk-quota issue.

## Phase 1 — Read-only financial engine

- Arc client and chain validation.
- Morpho market/vault discovery.
- Position reconstruction.
- Exact fixed-point health and liquidation calculations.
- Oracle/liquidity status.
- No transaction writes.

## Phase 2 — Transaction preparation

- Vault deposit/redeem.
- Supply collateral and borrow.
- Repay and withdraw.
- Approval, permit and Morpho authorization handling.
- Official bundle routes.
- Full transaction simulation and balance deltas.

## Phase 3 — Product UX

- Landing page.
- Market discovery.
- Earn and borrow flows.
- Position dashboard.
- Beginner/advanced modes.
- Risk and exit views.
- Mobile support.
- Explorer evidence.

## Phase 4 — Fork verification and security review

- Full Arc fork suite.
- Failure-path testing.
- Dependency and bytecode checks.
- Independent code review.
- Operational monitoring.

## Phase 5 — Mainnet canary

Only after explicit approval:

- Minimal-value lifecycle.
- Public deployment/configuration manifest.
- Public repository.
- Real explorer links.
- No fabricated metrics.

## Phase 6 — Alerts and operational hardening

- Redundant indexer/RPC.
- Position alerts.
- Reconciliation.
- Incident and stale-data handling.

## Phase 7 — Optional bounded automation

- Repay-reserve specification.
- Formal invariants and audit.
- Limited canary cap.
- Keeper redundancy.
- Explicit opt-in.

Aave aggregation, tokenized equities, LP automation or perpetual strategies should be separate future decisions, not silently added to this scope.

———

# Microgrant timing assessment

The Arc Microgrants rules require:

- A working Arc mainnet application.
- A live link.
- A public repository.
- A public builder profile.
- Submission by October 14, 2026 at 23:59 ET.

Today is October 13, 2026. A custom unaudited financial protocol cannot credibly be built and deployed safely inside that window.

A grant-eligible mainnet submission is still technically possible only if it is limited to:

- A high-quality direct interface to already-deployed Morpho contracts.
- Real read-only Arc state.
- A small, explicitly approved mainnet deposit/withdraw or borrow/repay canary.
- Public source and actual explorer evidence.
- No new asset-holding contract.
- No claim that the complete roadmap is already production-ready.

The schedule should not force deployment of the optional keeper module.

———

# Why this is not another generic DeFi dashboard

This adaptation preserves the actual working financial state machine:

capital supplier deposits
→ receipt shares represent the claim
→ borrower supplies isolated collateral
→ oracle and LLTV determine borrowing power
→ debt accrues from utilization
→ borrower repays or is liquidated
→ supplier exits subject to actual liquidity

The application does more than display protocol data. It owns the hard integration layer:

- Market selection and risk policy
- Exact transaction construction
- Atomic multi-step execution
- Before/after financial simulation
- Position-risk monitoring
- Honest exit-liquidity handling
- Onchain proof and recovery
- Beginner and expert presentation of the same underlying state

The financial operation comes directly from Zona and Peridot, and it runs through verified, already-liquid Arc lending infrastructure. AutoRange contributes only a compatible bounded-authority pattern for later defensive automation. No unrelated AMM, perpetual, AI, token or cross-chain mechanism is being attached for appearance.

Final recommendation: CONDITIONAL GO.

Proceed with the Arc lending workstation architecture after approving:

1. Morpho as the primary execution layer.
2. cirBTC/WETH collateral and USDC/EURC lending as the initial asset set.
3. No custom financial contract in the deadline-driven mainnet release.
4. The repay-only automation module as a later audited phase.
5. Resolution of the local disk-quota blocker.
6. Explicit approval before any mainnet transaction or deployment.

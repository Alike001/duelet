# Arc Microgrants submission draft

## Duelet — Invoice once. Pay over time.

Duelet helps clients fund contractor engagements upfront in USDC while the
recipient earns funds over an agreed schedule and claims them to their wallet.
It is deployed on Arc mainnet, with a confirmed 0.01 USDC funding and full claim.

The payer deposits the entire invoice amount into a non-upgradeable escrow.
The contract calculates earned and claimable funds from elapsed time. Anyone
can trigger a claim, but payment always goes to the stored recipient. The payer
can cancel before maturity: future vesting stops, unearned funds return to the
payer, and earned funds remain claimable. Duelet does not verify work completion
or resolve disputes.

Arc supplies USDC settlement and USDC-denominated gas. Duelet separates the
six-decimal ERC-20 accounting from the native gas representation. The contract
has no owner, fees, proxy, governance token, or admin withdrawal path.

The public payment proof reconciles the funded amount, withdrawals, refunds,
and remaining escrow against confirmed contract state. Onchain addresses,
amounts, schedules, and transactions are public. Personal invoice views are
wallet filters, not private records.

## Links

- Live application: https://duelet.vercel.app
- Public repository: https://github.com/Alike001/duelet
- Builder profile: https://github.com/Alike001
- Verified contract: https://explorer.arc.io/address/0x90d3e5aee13d444ec0679bdd3663dee823a3959f?tab=contract
- Mainnet payment proof: https://duelet.vercel.app/proof/0x5d98e7345f25df8b961e06c9631ab7287633132a1fb28e3611ea05e47ae406f6
- Funding receipt: https://explorer.arc.io/tx/0xc8eda3ec664830e7eb1a0ca5702b266cc8df1eaf2ed1d3cbd1d495cab065acc6
- Full claim receipt: https://explorer.arc.io/tx/0x593c0b32116699c69d7ed46ca80a49684dfe0be0639c6f903c6c64480e1512c1

## Verified scope and remaining checks

Read-only RPC verification found 0.010000 USDC funded, 0.010000 USDC withdrawn,
zero refunds, zero invoice liability, zero aggregate liability, and a solvent
contract. See [the evidence record](MAINNET_LIFECYCLE_EVIDENCE.md) for its block
and timestamp. This demonstration does not establish customer traction.

The contract is unaudited. Circle issuer controls and public RPC availability
remain dependencies. A mainnet partial claim/cancellation example has not been
verified. The demo must identify cancellation examples as illustrative.

Before submitting, verify the intended frontend revision is live, complete the
real-phone wallet check, and confirm applicant declarations in the application
portal. This draft is not evidence that an application has been submitted.

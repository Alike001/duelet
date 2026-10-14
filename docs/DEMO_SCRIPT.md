# Duelet 60–90 second demo script

Use confirmed mainnet data after deployment. Until then, explicitly say
“illustrative preview” and do not imply funds moved.

**0–12 seconds — purpose**

“Duelet turns one funded USDC invoice into a transparent payment schedule on
Arc. The payer deposits once; the payee earns over time.” Show the landing hero
and its preview label.

**12–28 seconds — create and fund**

Open the creation flow. Show distinct payer/payee addresses, 0.010000 USDC, the
300-second schedule and exact allowance. Explain: “The invoice exists only if
the complete escrow transfer succeeds.”

**28–45 seconds — vest and claim**

Open the real invoice. Point to deposit, vested, withdrawn, claimable and
liability. Trigger or show the confirmed partial claim receipt. Explain:
“Entitlement vests each second, but USDC moves only when a claim is triggered.
Anyone can trigger it; funds can only reach the stored payee.”

**45–62 seconds — cancel safely**

Show the cancellation preview immediately before signing or its confirmed
receipt. Explain: “Cancellation stops future vesting. Unused USDC returns to the
payer, while earned funds remain owed to the payee.”

**62–78 seconds — prove reconciliation**

Open `/proof/<invoiceId>`. Show the contract, chain 5042, transaction hashes and
the identity: original deposit = withdrawn + refunded + remaining liability.
After the final claim, show zero liability.

**78–90 seconds — trust boundary**

“Duelet is non-upgradeable, has no admin withdrawal and remains unaudited. The
proof is on Arc, and recipients can call the contract directly if this frontend
disappears.” End on the documentation/source links.

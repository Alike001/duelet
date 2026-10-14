# First task for Codex in the new workspace

This is a NEW Arc DeFi project workspace. Do NOT read/write or modify the older `../arc-obligation-protocol` Git repository except a read-only `git status` if requested. The user's prior programmable-obligations code must remain untouched.

Read `./research/REVERSE_ENGINEERING_REPORT.md` and `./research/START_HERE.md` in full before taking any action.

The previous research was performed inside the old Codex workspace, but the resulting report was exported here so it is preserved. Treat the report as evidence to be verified—not immutable truth or a fully approved product specification.

OUR METHOD: reverse-engineer proven implementations of Zona, Peridot, Aqua0, Lockgate, AutoRange, Atoma and adapt financially coherent, supported mechanisms to actual Arc infrastructure. Do not brainstorm an unrelated product. Do not immediately narrow to one trivial dashboard, and do not combine incompatible architectures merely because they exist.

IMPORTANT FINDING: The strongest evidence currently supports reconstructing Zona/Peridot-style lending lifecycle through already deployed Morpho markets and vaults. This is a CONDITIONAL GO, not automatic permission to implement.

YOUR FIRST JOB IS READ-ONLY:

1. Confirm the new directory is separate from the old repository; report cwd and Git status, but do not initialize a repo yet.
2. Diagnose the reported disk-quota blocker using read-only df/du/quota commands. Never delete caches, repos, logs, files or branches automatically. Give the user a safe cleanup proposal and wait for approval if disk capacity is insufficient.
3. Audit the reported Morpho Arc addresses and selected markets/vaults directly via current official documentation + Arc RPC. Separate VERIFIED, PARTIALLY VERIFIED and UNVERIFIED claims.
4. Identify exact live market IDs, assets/decimals, oracle/IRM/LLTV, latest collateral and borrowing/withdrawal liquidity, vault exit mechanics, and dependencies. Never infer liquidity from TVL.
5. Compare our possible UX and workflows against the current official Morpho app, Circle Borrow/Earn Kit, Zona, and Peridot. Explain what substantive value our product would offer and whether it deserves to exist separately. Do not sell a cosmetic frontend as a protocol innovation.
6. Design an explicit and appropriately comprehensive product feature set based on mechanisms already implemented by the reference products: real Earn lifecycle, real Borrow lifecycle, market-risk simulation, clear exits, portfolio and activity, owner-only or consented transactions. Defer unrelated strategies unless dependencies are verified.
7. Audit the source/license requirements for reuse; prefer SDK integration with existing contracts rather than unaudited recreation of lending pools.
8. Produce a decision memo with GO / CONDITIONAL GO / NO GO, proof gaps, financial/security invariants, full UX and landing-page information architecture, and build phases that do not assume fake mainnet transactions.

Do NOT scaffold Next.js, install dependencies, run deployments, create contracts, write implementation code, push to GitHub, or spend funds. Do NOT delete the old project. STOP after the research verification and product decision memo and await user approval.

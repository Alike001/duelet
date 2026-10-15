// Read-only: prints verified mainnet evidence; never signs or broadcasts.
import {
  createPublicClient,
  http,
  parseAbi,
  decodeEventLog,
  keccak256,
} from 'viem';
import ts from 'typescript';
import { readFileSync } from 'node:fs';
const source = readFileSync(
  new URL('../apps/web/lib/abi.ts', import.meta.url),
  'utf8',
);
const js = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext },
}).outputText;
const { dueletAbi } = await import(
  'data:text/javascript;base64,' + Buffer.from(js).toString('base64')
);
const client = createPublicClient({
  transport: http('https://rpc.mainnet.arc.io'),
});
const address = '0x90d3e5aee13d444ec0679bdd3663dee823a3959f';
const latest = await client.getBlockNumber();
const logs = [];
for (let from = 26007220n; from <= latest; from += 9999n) {
  const to = from + 9998n < latest ? from + 9998n : latest;
  logs.push(
    ...(await client.getLogs({ address, fromBlock: from, toBlock: to })),
  );
}
const events = [];
for (const log of logs) {
  const decoded = decodeEventLog({
    abi: dueletAbi,
    data: log.data,
    topics: log.topics,
  });
  const block = await client.getBlock({ blockNumber: log.blockNumber });
  const receipt = await client.getTransactionReceipt({
    hash: log.transactionHash,
  });
  events.push({
    ...decoded,
    transactionHash: log.transactionHash,
    blockNumber: log.blockNumber,
    timestamp: block.timestamp,
    status: receipt.status,
    gasUsed: receipt.gasUsed,
    effectiveGasPrice: receipt.effectiveGasPrice,
  });
}
const ids = [...new Set(events.map((e) => e.args.invoiceId))];
const invoices = [];
for (const id of ids) {
  const state = await client.readContract({
    address,
    abi: dueletAbi,
    functionName: 'getInvoice',
    args: [id],
    blockNumber: latest,
  });
  const liability = await client.readContract({
    address,
    abi: dueletAbi,
    functionName: 'invoiceLiability',
    args: [id],
    blockNumber: latest,
  });
  invoices.push({
    id,
    state,
    liability,
    proofUrl: 'https://duelet.vercel.app/proof/' + id,
  });
}
const extra = parseAbi([
  'function totalOutstandingLiability() view returns (uint256)',
  'function isSolvent() view returns (bool)',
  'function USDC() view returns (address)',
]);
const chainId = await client.getChainId();
const code = await client.getCode({ address, blockNumber: latest });
const checks = {};
for (const functionName of ['totalOutstandingLiability', 'isSolvent', 'USDC'])
  checks[functionName] = await client.readContract({
    address,
    abi: extra,
    functionName,
    blockNumber: latest,
  });
if (
  chainId !== 5042 ||
  keccak256(code) !==
    '0xf4ad4b494fd7d609868ae5737d5840ee903b001767718cba4f249309ff84606f' ||
  checks.USDC.toLowerCase() !== '0x3600000000000000000000000000000000000000'
)
  throw new Error('Deployment identity mismatch');
for (const invoice of invoices) {
  const s = invoice.state;
  if (
    s.totalAmount !==
    s.withdrawnAmount + s.refundedAmount + invoice.liability
  )
    throw new Error('Invoice accounting mismatch');
}
const result = {
  verifiedAt: new Date().toISOString(),
  chainId,
  address,
  block: latest,
  runtimeHash: keccak256(code),
  checks,
  events,
  invoices,
};
const json = JSON.stringify(
  result,
  (_, value) => (typeof value === 'bigint' ? value.toString() : value),
  2,
);
console.log(json);

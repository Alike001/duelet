import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const contracts = resolve(root, 'contracts');
const output = resolve(root, 'artifacts', 'blockscout');
const usdc = '0x3600000000000000000000000000000000000000';
const constructorArgs = `0x${usdc.slice(2).padStart(64, '0')}`;

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: contracts,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
    ...options,
  }).trim();
}

function sha256(value) {
  return `0x${createHash('sha256').update(value).digest('hex')}`;
}

function write(name, value) {
  const path = resolve(output, name);
  writeFileSync(path, `${value.trim()}\n`);
  return path;
}

run('arc-forge', ['build', '--force', '--build-info', '--deny', 'never']);

const standardInputRaw = run('arc-forge', [
  'verify-contract',
  '0x0000000000000000000000000000000000000001',
  'src/DueletStream.sol:DueletStream',
  '--show-standard-json-input',
  '--chain',
  '5042',
  '--compiler-version',
  '0.8.37',
]);
const standardInput = `${JSON.stringify(JSON.parse(standardInputRaw), null, 2)}\n`;

const artifactPath = resolve(
  contracts,
  'out',
  'DueletStream.sol',
  'DueletStream.json',
);
const artifact = JSON.parse(readFileSync(artifactPath, 'utf8'));
const creationBytecode = artifact.bytecode.object;
const genericRuntime = artifact.deployedBytecode.object;
const immutableReferences = artifact.deployedBytecode.immutableReferences;
const immutableWord = usdc.slice(2).padStart(64, '0').toLowerCase();
let expectedRuntime = genericRuntime.slice(2).toLowerCase();

for (const references of Object.values(immutableReferences)) {
  for (const { start, length } of references) {
    if (length !== 32)
      throw new Error(`Unexpected immutable length: ${length}`);
    const offset = start * 2;
    expectedRuntime = `${expectedRuntime.slice(0, offset)}${immutableWord}${expectedRuntime.slice(offset + length * 2)}`;
  }
}
expectedRuntime = `0x${expectedRuntime}`;
const deploymentInput = `${creationBytecode}${constructorArgs.slice(2)}`;
const runtimeKeccak = run('arc-cast', ['keccak', expectedRuntime]);
const creationKeccak = run('arc-cast', ['keccak', creationBytecode]);
const deploymentInputKeccak = run('arc-cast', ['keccak', deploymentInput]);
const sourceBlob = execFileSync(
  'git',
  ['hash-object', 'contracts/src/DueletStream.sol'],
  { cwd: root, encoding: 'utf8' },
).trim();

mkdirSync(output, { recursive: true });
write('standard-input.json', standardInput);
write('constructor-args.txt', constructorArgs);
write('creation-bytecode.hex', creationBytecode);
write('deployment-input.hex', deploymentInput);
write('expected-runtime-bytecode.hex', expectedRuntime);

const manifest = {
  status: 'PREPARED_NOT_DEPLOYED',
  chainId: 5042,
  contract: 'src/DueletStream.sol:DueletStream',
  contractSourceGitBlob: sourceBlob,
  compiler: '0.8.37',
  evmVersion: 'osaka',
  optimizer: { enabled: true, runs: 200 },
  constructor: { type: 'address', value: usdc, abiEncoding: constructorArgs },
  sizes: {
    creationBytecodeBytes: (creationBytecode.length - 2) / 2,
    deploymentInputBytes: (deploymentInput.length - 2) / 2,
    expectedRuntimeBytes: (expectedRuntime.length - 2) / 2,
  },
  hashes: {
    creationBytecodeKeccak256: creationKeccak,
    deploymentInputKeccak256: deploymentInputKeccak,
    expectedRuntimeKeccak256: runtimeKeccak,
    standardInputSha256: sha256(standardInput),
  },
  immutableReferenceCount: Object.values(immutableReferences).reduce(
    (total, references) => total + references.length,
    0,
  ),
};
write('manifest.json', JSON.stringify(manifest, null, 2));

process.stdout.write(
  `Prepared ${output}\nExpected runtime hash: ${runtimeKeccak}\n`,
);

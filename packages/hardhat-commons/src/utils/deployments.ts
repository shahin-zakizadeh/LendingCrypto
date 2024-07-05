import { ContractTransaction } from 'ethers';

export function isProd(): boolean {
  return process.env.NODE_ENV === 'prod';
}

export async function waitTx(fn: () => Promise<ContractTransaction>): Promise<boolean> {
  try {
    const tx = await fn();
    if (isProd()) {
      await tx.wait(4);
    }
  } catch (e) {
    console.log(e);
    return false;
  }
  return true;
}

export async function exec(fn: () => Promise<ContractTransaction>): Promise<boolean> {
  let success = false;
  const maxAttempts = 3;
  for (let i = 0; i < maxAttempts && !success; i++) {
    success = await waitTx(fn);
  }
  return success;
}

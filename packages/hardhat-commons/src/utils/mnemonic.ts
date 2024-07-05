import fs from "fs";
import { MNEMONIC_PATH } from "../constants";

export const getMnemonic = (): string => {
  try {
    return fs
      .readFileSync(`./${MNEMONIC_PATH}`)
      .toString()
      .trim();
  } catch (e) {
    if (process.env.HARDHAT_TARGET_NETWORK !== 'localhost') {
      console.log(
        '☢️ WARNING: No mnemonic file created for a deploy account. Using default mnemonic. Try `yarn generate` and then `yarn account`.'
      );
    }
  }
  return 'test test test test test test test test test test test test';
};

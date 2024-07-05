export type ContractAddressMap = {
  [chainId: number]: {
    [contractName: string]: string;
  };
}

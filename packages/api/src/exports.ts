import deployments from "../generated/deployments.json";

export interface ContractExport {
    address: string;
    abi: any;
  }
  
  export interface Export {
    chainId: string;
    name: string;
    contracts: { [name: string]: ContractExport };
  }
  
  export type MultiExport = {
    [chainId: string]: Export[];
  };
  
  const contractsByNetwork = deployments as MultiExport;
  
  export const getExport = (contractId: string, network: number) => {
    return contractsByNetwork[network][0].contracts[contractId];
  };
import { ContractAddressMap } from "@lenclub/hardon";

export const FANTOM_CHAIN_ID = 250

export const externalAddresses: ContractAddressMap = {
    [FANTOM_CHAIN_ID]: {
        DAI: '0x8D11eC38a3EB5E956B052f67Da8Bdc9bef8Abf3E',
        DAI_WHALE: "0xaAD747958F996B22F360fD1d0e3BA56eFD477C1f",
        USDC: '0x04068DA6C83AFCFA0e13ba15A6696662335D5B75',
        USDC_WHALE: '0xa481f1cbd1193007a34a5ff6911db044e78d9a00',
        WFTM: '0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83',
        WFTM_WHALE: '0x431e81e5dfb5a24541b5ff8762bdef3f32f96354',
        WETH: '0x74b23882a30290451A17c44f4F05243b6b58C76d',
        EQ_ROUTER: "0x1A05EB736873485655F29a37DEf8a0AA87F5a447",
        EQ_PAIR_FACTORY: "0xc6366EFD0AF1d09171fe0EBF32c7943BB310832a",
        EQ_vDAI_WFTM: "0x0f03efdce7A8cE08c238b1a0B5425Fb63Bd44b38",
        CL_FTM_FEED: "0xf4766552D15AE4d256Ad41B6cf2933482B0680dc",
        CL_USDC_FEED: "0x2553f4eeb82d5A26427b8d1106C51499CBa5D99c",
        TREASURY: "0xD5a26DEBe9748F3d5fb292f74D91d8dB8A44E956"
    }
}
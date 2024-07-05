# Security

The Lending Platform takes security seriously, and we have implemented several measures to ensure the safety of user funds and the stability of the platform. In this section, we will outline the different security features implemented on the Lending Platform.

## Limit on mUSD Borrowing

The Lending Platform limits the amount of mUSD that can be borrowed from a single market. This helps to reduce the exposure of mUSD to a single type of collateral, reducing the risk of loss in the event of a sharp decline in the value of a specific collateral asset.

## Circuit Breakers

Circuit breakers are an important feature of the Lending Platform that allows administrators to temporarily pause borrowing on a market. Circuit breakers can be triggered by administrators, off-chain infrastructure (permissioned), or smart contracts (permissionless) to protect the platform and users from potential risks. When triggered, all other features of the market continue to operate as expected, ensuring that users can continue to manage their accounts and repay their loans.

## Daily Issuance Limits

The Lending Platform limits the daily issuance of mUSD to mitigate losses in the event of an exploit on the collateral. This helps to prevent a sudden surge in the supply of mUSD, which could lead to a sharp decline in its value. By limiting daily issuance, the Lending Platform can better manage the supply of mUSD and ensure the stability of the platform.
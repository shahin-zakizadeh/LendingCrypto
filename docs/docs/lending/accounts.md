## Accounts

Accounts on the lending platform are represented as non-fungible tokens (NFTs) and provide users with the ability to deposit and withdraw collateral, borrow and repay principal, and view their account balances.

### Deposits and Withdrawals

Users can deposit and withdraw collateral from their accounts at any time. The deposited collateral can be used as collateral to borrow mUSD on the platform. Users can withdraw their deposited collateral at any time, provided that they have sufficient collateral in their account to cover their outstanding loans.

### Borrowing and Repaying Principal

Users can borrow mUSD from their accounts up to a certain percentage of their deposited collateral, as defined by the maximum loan to value parameters of the market. The borrowed principal has an interest rate, but there is no due date for repayment. Users can repay the borrowed principal with interest at any time.

### LTV and Health Ratio

Each account has a loan to value (LTV) ratio and a health ratio. The LTV ratio is the ratio of the borrowed principal to the deposited collateral. The health ratio is the ratio of the account's collateral value to the total borrowed principal and accrued interest. The health ratio is a measure of the account's solvency and is used to determine when an account should be liquidated.

### Liquidation

When an account's health ratio falls below 1, the account can be liquidated. Liquidation is the process of selling the collateral to repay the outstanding loans. When an account is liquidated, it will suffer a liquidation penalty, which is a percentage of the outstanding loan value. The penalty is rewarded to the liquidator as an incentive to keep the platform solvent.
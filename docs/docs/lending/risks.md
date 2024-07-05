# Risks

The Lending Platform provides an innovative way for users to borrow mUSD using their deposited collateral, but it is not without risk. In this section, we will outline the different types of risks associated with the lending markets.

## Smart Contract Risk

The Lending Platform relies on smart contracts to manage the lending markets. While the smart contracts have been designed and implemented to the best of our knowledge, there is always the risk of undiscovered vulnerabilities or flaws in the code that could be exploited by attackers. Currently, the smart contracts have not undergone a formal audit, and as such, there is no guarantee of their safety and security.

## Oracle Risk

The Lending Platform relies on price oracles to determine the value of the collateral and the borrowed mUSD. If the price oracle is compromised or provides inaccurate data, it could lead to incorrect valuations of the collateral and borrowed mUSD. This could result in a user being liquidated prematurely, losing their collateral, or borrowing more than they can repay.

## Collateral Risk

The Lending Platform relies on the deposited collateral to ensure that loans are adequately secured. However, there are several risks associated with the collateral, including:

1. **Big Price Swings and Liquidation**: The value of the deposited collateral can fluctuate rapidly, and if the value drops below the minimum collateralization ratio, the borrower's account can be liquidated, and the collateral sold to repay the outstanding loan.

2. **Collateral Exploitation**: If the collateral is exploited or hacked, it could lead to bad debt if the value of the collateral drops below the minimum collateralization ratio, and the loan cannot be fully repaid.

3. **Centralization of Collateral**: If the collateral is centralized or controlled by a single entity, there is a risk that the entity could manipulate the value of the collateral, leading to inaccurate valuations and liquidations.

4. **Lack of Liquidity**: If there is a lack of liquidity in the market for the deposited collateral, it could lead to price manipulation or difficulty in liquidating the collateral in the event of a default.

## Bad Debt

Bad debt occurs when the loans become under-collateralized, either due to a malfunction in the smart contracts or because the liquidators did not have enough time to liquidate the account before it becomes under-collateralized. In such cases, the outstanding loan cannot be fully repaid, and the borrower could default on their loan.
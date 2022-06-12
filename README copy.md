# Goal of this project

> Learn how a decentralized exchange works
> Learn how to set up a blockchain project
> Create a pool creation and rewards protocol
> Create a token transfer protocol
> Use a native token as incentive
> Test solidity contracts

# Pool Flow

1. creator sends 2 tokens to create the pool and its amm constant - deploy a new contract
2. creator gets an LPToken in return showing that he owns 100% of the liquidity

3. users get the estimate of what they get in return
4. users send token1 and receive token2 based on the AMM

5. investor adds liquidity to the pool
6. investor get LPTokens based on their proportion of the liquidity - sqrt(X\*Y)

7. LPToken owners can burn their tokens for their liquidity back
8. LPToken owners get the percentage of the liquidity available based on the LPToken percentage owned

9. users pay fees
10. LPToken owners receive percentage of the fees on withdraw

11. users face slippage

# Libraries

## string

> concat

## array

> remove

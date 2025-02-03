# final-project

To deploy and run the project, you need to have a .env file with the following variables:

- `PRIVATE_KEY` (total 3 to test the voting function)
- `SEPOLIA_RPC_URL`

to first create the dao,run script:

```
npx hardhat run scripts/create-dao.js --network sepolia
```

paste the address of the userside contract,governance token address,create governance address in the helper-hardhat-config.js file

to deploy the contracts,run scripts in deploy folder

create a proposal,run script:

```
npx hardhat run scripts/create-proposal.js --network sepolia
```

to get the user id,run script:

```
npx hardhat run scripts/get-user-id.js --network sepolia
```

after deploying the contracts,run scripts in scripts folder to test the voting functions

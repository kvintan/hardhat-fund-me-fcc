const { getNamedAccounts, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")
const {
  isCallTrace,
} = require("hardhat/internal/hardhat-network/stack-traces/message-trace")
const { assert } = require("chai")

developmentChains.includes(network.name)
  ? describe.skip
  : describe("FundMe", function () {
      let fundMe
      let deployer
      const sendValue = ethers.parseEther("50")
      beforeEach(async function () {
        deployer = (await getNamedAccounts()).deployer
        fundMe = await ethers.getContract("FundMe", deployer)
      })

      it("allows people to fund and withdraw", async function () {
        await fundMe.fund({ value: sendValue })
        await fundMe.withdraw()
        const endingBalance = await fundMe.provider.getBalance(
          fundMe.getAddress()
        )
        assert.equal(endingBalance.toString(), "0")
      })
    })

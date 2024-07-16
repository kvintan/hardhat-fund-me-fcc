const { ethers, deployments, getNamedAccounts } = require("hardhat")
const { assert, expect } = require("chai")
const { developmentChains } = require("../../helper-hardhat-config")

developmentChains.includes(network.name)
  ? describe.skip
  : describe("FundMe", function () {
      let fundMe
      let deployer
      let mockV3Aggregator
      const sendValue = ethers.parseEther("50")
      beforeEach(async function () {
        // Deploy FundMe contract
        // const accounts = await ethers.getSigners()
        deployer = (await getNamedAccounts()).deployer
        await deployments.fixture(["all"])
        fundMe = await ethers.getContract("FundMe", deployer)
        mockV3Aggregator = await ethers.getContract(
          "MockV3Aggregator",
          deployer
        )
      })

      describe("constructor", function () {
        it("sets the aggregator address correctly", async function () {
          const response = await fundMe.getPriceFeed()
          assert.equal(response, await mockV3Aggregator.getAddress())
        })
      })

      describe("FundMe", function () {
        it("Fails if you don't send enough ETH", async function () {
          await expect(fundMe.fund()).to.be.revertedWith(
            "You need to spend more ETH!"
          )
        })

        it("updated the amount funded data structure", async function () {
          await fundMe.fund({ value: sendValue })
          const response = await fundMe.getAddressToAmountFunded(deployer)
          assert.equal(response.toString(), sendValue.toString())
        })

        it("Add getfunder to array of getfunder", async function () {
          await fundMe.fund({ value: sendValue })
          const response = await fundMe.getFunder(0)
          assert.equal(response, deployer)
        })
      })

      describe("withdraw", function () {
        beforeEach(async function () {
          await fundMe.fund({ value: sendValue })
        })

        it("Withdrawy ETH from a single founder", async function () {
          // Arrange
          const startingFundMeBalance = await ethers.provider.getBalance(
            fundMe.getAddress()
          )
          const startingDeployerBalance = await ethers.provider.getBalance(
            deployer
          )

          // Act
          const transactionResponse = await fundMe.withdraw()
          const transactionReceipt = await transactionResponse.wait()
          const { gasUsed, gasPrice } = transactionReceipt
          const gasCost = gasUsed * gasPrice // multiply

          const endingFundMeBalance = await ethers.provider.getBalance(
            fundMe.getAddress()
          )
          const endingDeployerBalance = await ethers.provider.getBalance(
            deployer
          )

          // Assert
          assert.equal(endingFundMeBalance, 0)
          assert.equal(
            (startingFundMeBalance + startingDeployerBalance).toString(), // Big Number using Big Number.add()
            (endingDeployerBalance + gasCost).toString()
          )
        })

        it("allows us to withdraw with multiple getfunder", async function () {
          const accounts = await ethers.getSigners()
          for (let i = 1; i < 6; i++) {
            // Start with 1 because 0 is deployer account
            const fundMeConnectedAccount = await fundMe.connect(accounts[i])
            await fundMeConnectedAccount.fund({ value: sendValue })
          }

          const startingFundMeBalance = await ethers.provider.getBalance(
            fundMe.getAddress()
          )
          const startingDeployerBalance = await ethers.provider.getBalance(
            deployer
          )

          // Act
          const transactionResponse = await fundMe.withdraw()
          const transactionReceipt = await transactionResponse.wait()
          const { gasUsed, gasPrice } = transactionReceipt
          const gasCost = gasUsed * gasPrice

          // Assert
          const endingFundMeBalance = await ethers.provider.getBalance(
            fundMe.getAddress()
          )
          const endingDeployerBalance = await ethers.provider.getBalance(
            deployer
          )

          // Assert
          assert.equal(endingFundMeBalance, 0)
          assert.equal(
            (startingFundMeBalance + startingDeployerBalance).toString(), // Big Number using Big Number.add()
            (endingDeployerBalance + gasCost).toString()
          )

          // Make sure the getfunder array is reset properly
          await expect(fundMe.getFunder(0)).to.be.reverted

          for (let i = 0; i <= 6; i++) {
            assert.equal(
              await fundMe.getAddressToAmountFunded(accounts[i].getAddress()),
              0
            )
          }
        })

        it("Only allows the owner to withdraw", async function () {
          const accounts = await ethers.getSigners()
          const fundMeConnectedAccount = await fundMe.connect(accounts[1])
          await expect(fundMeConnectedAccount.withdraw()).to.be.revertedWith(
            "FundMe__NotOwner"
          )
        })

        it("cheaperWithdraw testing...", async function () {
          const accounts = await ethers.getSigners()
          for (let i = 1; i < 6; i++) {
            // Start with 1 because 0 is deployer account
            const fundMeConnectedAccount = await fundMe.connect(accounts[i])
            await fundMeConnectedAccount.fund({ value: sendValue })
          }

          const startingFundMeBalance = await ethers.provider.getBalance(
            fundMe.getAddress()
          )
          const startingDeployerBalance = await ethers.provider.getBalance(
            deployer
          )

          // Act
          const transactionResponse = await fundMe.cheaperWithdraw()
          const transactionReceipt = await transactionResponse.wait()
          const { gasUsed, gasPrice } = transactionReceipt
          const gasCost = gasUsed * gasPrice

          // Assert
          const endingFundMeBalance = await ethers.provider.getBalance(
            fundMe.getAddress()
          )
          const endingDeployerBalance = await ethers.provider.getBalance(
            deployer
          )

          // Assert
          assert.equal(endingFundMeBalance, 0)
          assert.equal(
            (startingFundMeBalance + startingDeployerBalance).toString(), // Big Number using Big Number.add()
            (endingDeployerBalance + gasCost).toString()
          )

          // Make sure the s_getfunder array is reset properly
          await expect(fundMe.getFunder(0)).to.be.reverted

          for (let i = 0; i <= 6; i++) {
            assert.equal(
              await fundMe.getAddressToAmountFunded(accounts[i].getAddress()),
              0
            )
          }
        })
      })
    })

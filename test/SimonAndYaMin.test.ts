import "@nomicfoundation/hardhat-chai-matchers";
import { expect } from "chai";
import { ethers } from "hardhat";

async function deploy() {
  const [owner, ...accounts] = await ethers.getSigners();

  const Contract = await ethers.getContractFactory("SimonAndYaMin");
  const deploymentPromise = Contract.deploy();
  const contract = await deploymentPromise;

  return { contract, owner, accounts, deploymentPromise };
}

let deployment: Awaited<ReturnType<typeof deploy>>;

beforeEach(async () => {
  deployment = await deploy();
});

describe("SimonAndYaMin", () => {
  describe("Deployment", () => {
    it("ownership", async () => {
      const { contract, owner } = deployment;

      for (let i = 0; i < 12; ++i) {
        expect(await contract.ownerOf(i)).to.equal(owner.address);
      }
    });

    it("locked status", async () => {
      const { contract } = deployment;
      for (let i = 0; i < 12; ++i) {
        expect(await contract.locked(i)).to.equal(false);
      }
    });
  });

  describe("Owner transfers token", () => {
    beforeEach(async () => {
      const { contract, owner, accounts } = deployment;
      const newContract = contract.connect(owner);

      await newContract["safeTransferFrom(address,address,uint256)"](
        owner,
        accounts[0],
        1
      );
    });

    it("does not affect other token ownership", async () => {
      const { contract, owner } = deployment;
      expect(await contract.ownerOf(0)).to.equal(owner.address);
    });

    it("updates the ownership of token", async () => {
      const { contract, owner, accounts } = deployment;
      expect(await contract.ownerOf(1)).to.equal(accounts[0].address);
    });

    it("transferred token is not soulbound", async () => {
      const { contract } = deployment;
      expect(await contract.locked(1)).to.equal(false);
    });

    it("contract owner can transfer other token", async () => {
      const { contract, owner, accounts } = deployment;
      const c = contract.connect(owner);
      await c["safeTransferFrom(address,address,uint256)"](
        accounts[0],
        accounts[1],
        1
      );
      expect(await contract.ownerOf(1)).to.equal(accounts[1].address);
    });

    it("token owner can transfer", async () => {
      const { contract, accounts } = deployment;
      const c = contract.connect(accounts[0]);
      await c["safeTransferFrom(address,address,uint256)"](
        accounts[0],
        accounts[1],
        1
      );
      expect(await contract.ownerOf(1)).to.equal(accounts[1].address);
    });
  });

  describe("locking tokens", () => {
    beforeEach(async () => {
      const { contract, owner, accounts } = deployment;
      const c = contract.connect(owner);

      await c["safeTransferFrom(address,address,uint256)"](
        owner,
        accounts[0],
        1
      );
      await c.lock(1);
    });

    it("is locked", async () => {
      const { contract } = deployment;
      expect(await contract.locked(1)).to.equal(true);
    });

    it("transfer should fail", async () => {
      const { contract, accounts } = deployment;
      const c = contract.connect(accounts[0]);
      await expect(
        c["safeTransferFrom(address,address,uint256)"](
          accounts[0],
          accounts[1],
          1
        )
      ).to.be.reverted;
    });

    it("should emit event", async () => {
      const { contract, owner } = deployment;
      const c = contract.connect(owner);
      await expect(c.lock(0)).to.emit(c, "Locked").withArgs(0);
    });

    it("relocking a locked token should not emit event", async () => {
      const { contract, owner } = deployment;
      const c = contract.connect(owner);
      await expect(c.lock(1)).to.not.emit(c, "Locked");
    });

    it("non owners cannot lock", async () => {
      const { contract, accounts } = deployment;
      const c = contract.connect(accounts[0]);
      await expect(c.lock(1)).to.be.reverted;
    });
  });

  describe("unlocking tokens", () => {
    beforeEach(async () => {
      const { contract, owner, accounts } = deployment;
      const c = contract.connect(owner);

      await c["safeTransferFrom(address,address,uint256)"](
        owner,
        accounts[0],
        1
      );
      await c["safeTransferFrom(address,address,uint256)"](
        owner,
        accounts[0],
        2
      );
      await c.lock(1);
      await c.lock(2);
      await c.unlock(1);
    });

    it("is not locked", async () => {
      const { contract } = deployment;
      expect(await contract.locked(1)).to.equal(false);
    });

    it("transfer should succeed", async () => {
      const { contract, accounts } = deployment;
      const c = contract.connect(accounts[0]);
      await expect(
        c["safeTransferFrom(address,address,uint256)"](
          accounts[0],
          accounts[1],
          1
        )
      )
        .to.emit(c, "Transfer")
        .withArgs(accounts[0].address, accounts[1].address, 1);
    });

    it("should emit event", async () => {
      const { contract, owner } = deployment;
      const c = contract.connect(owner);
      await expect(c.unlock(2)).to.emit(c, "Unlocked").withArgs(2);
    });

    it("unlocking a unlocked token should not emit event", async () => {
      const { contract, owner } = deployment;
      const c = contract.connect(owner);
      await expect(c.unlock(1)).to.not.emit(c, "Unlocked");
    });

    it("non owners cannot unlock", async () => {
      const { contract, accounts } = deployment;
      const c = contract.connect(accounts[0]);
      await expect(c.unlock(1)).to.be.reverted;
    });
  });

  describe("batchTransfer", () => {
    it("owner calls batch transfer, all tokens get sent and locked", async () => {
      const { contract, owner, accounts } = deployment;
      const c = contract.connect(owner);

      const recepients = accounts
        .slice(0, 12)
        .map((account) => account.address);

      const p = c.batchTransfer(recepients);

      await Promise.all(
        recepients.map((recepient, index) =>
          Promise.all([
            expect(p)
              .to.emit(c, "Transfer")
              .withArgs(owner.address, recepient, index),
            expect(p).to.emit(c, "Locked").withArgs(index),
          ])
        )
      );

      for (let i = 0; i < 12; ++i) {
        expect(await c.ownerOf(i)).to.equal(recepients[i]);
      }
    });

    it("should revert if sending too many", async () => {
      const { contract, owner, accounts } = deployment;
      const c = contract.connect(owner);

      const recepients = accounts
        .slice(0, 13)
        .map((account) => account.address);

      await expect(c.batchTransfer(recepients)).to.be.reverted;
    });

    it("should revert if not owner sends", async () => {
      const { contract, accounts } = deployment;
      const c = contract.connect(accounts[0]);

      const recepients = accounts
        .slice(0, 12)
        .map((account) => account.address);

      await expect(c.batchTransfer(recepients)).to.be.reverted;
    });
  });
});

import { ethers } from "hardhat";

async function main() {
  if (!process.env.OWNER_ADDRESS) {
    throw new Error("Failed to deploy: no owner address");
  }

  const lock = await ethers.deployContract("SimonAndYaMin", [
    process.env.OWNER_ADDRESS,
  ]);

  await lock.waitForDeployment();

  console.log(
    `Deployed to ${lock.target}, owner: ${process.env.OWNER_ADDRESS}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

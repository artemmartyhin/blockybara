//setup
import fs from "fs";
import path from "path";
import { network, ethers } from "hardhat";

interface Config {
  hub: string;
  block: number;
}

async function main() {
  const envs: Map<string, Config> = new Map();
  if (process.env.FHE_HUB && process.env.FHE_BLOCK) {
    envs.set("fhenix", {
      hub: process.env.FHE_HUB || "",
      block: parseInt(process.env.FHE_BLOCK || "0"),
    });
  }

  const shared = "/usr/src/app/packages/onchain/deployments";
  const deploymentPath = path.join(shared, "deployments.json");

  if (!fs.existsSync(shared)) {
    fs.mkdirSync(shared, { recursive: true });
  }

  if (!fs.existsSync(deploymentPath)) {
    fs.writeFileSync(deploymentPath, "{}");
  }

  const deployment = fs.existsSync(deploymentPath)
    ? JSON.parse(fs.readFileSync(deploymentPath, "utf8"))
    : {};

  const artifact = path.join("./artifacts/contracts/BlockybaraHub.sol", "BlockybaraHub.json");
  const abi = JSON.parse(fs.readFileSync(artifact, "utf8")).abi;

  if (!deployment.abi) {
    deployment.abi = abi;
  }

  if (!deployment.contracts) {
    deployment.contracts = {};
  }

  if (deployment.contracts[network.name]) {
    if (deployment.contracts[network.name].verifying_contract) {
      console.log(
        `\x1b[33m[${network.name}] BlockybaraHub already exists: ${deployment.contracts[network.name].verifying_contract}\x1b[0m`
      );
      return;
    }
  }
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY as string, ethers.provider);
  const signerAddress = await signer.getAddress();
  const response = await fetch(`http://localfhenix_hh_plugin:3000/faucet?address=${signerAddress}`);
  if (response.status !== 200) {
    throw new Error(
      `Failed to get funds from faucet: ${response.status}: ${response.statusText}`,
    );
  }
  await new Promise(resolve => setTimeout(resolve, 5000))
  const blockybaraHub = await ethers.getContractFactory("BlockybaraHub", signer);
  const instance = await blockybaraHub.deploy(signerAddress);
  const address = await instance.getAddress();

  console.log(
    `\x1b[32m[${network.name}] BlockybaraHub intialized: ${address}\x1b[0m`
  );

  const url = "url" in network.config ? network.config.url : "";

  if (!url) {
    console.log(
      `\x1b[31m[${network.name}] No RPC URL found for ${network.config.chainId}\x1b[0m`
    );
    return;
  }

  deployment.contracts[network.name] = {
    chainId: network.config.chainId,
    rpc_url: url,
    block: envs.get(network.name)?.block || 0,
  };

  fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));

  console.log(
    `\x1b[36m[${network.name}] Configuration updated\x1b[0m`
  );
}

main();

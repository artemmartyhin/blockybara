import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";
import "hardhat-deploy";
import "hardhat-ignore-warnings";
import type { HardhatUserConfig } from "hardhat/config";
import { resolve } from "path";

import "fhenix-hardhat-plugin";
import "fhenix-hardhat-docker";

dotenv.config({ path: resolve(__dirname, process.env.DOTENV_CONFIG_PATH || "./.env") });

const config: HardhatUserConfig = {
  solidity: {
    compilers: [{ version: "0.8.25" }]
  },
  defaultNetwork: "localfhenix",
  networks: {
    localfhenix: {
      url: "http://localfhenix_hh_plugin:8547"
    }
  },
};

export default config;

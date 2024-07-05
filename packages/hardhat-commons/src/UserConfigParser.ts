import { HardhatConfig, HardhatUserConfig } from "hardhat/types";
import path from "path";
import { MNEMONIC_PATH } from "./constants";

type ConfigTransformer = (config: HardhatConfig, userConfig: HardhatUserConfig) => void

export class UserConfigParser {

  private transformers: ConfigTransformer[]
  constructor() {
    this.transformers = [
      handleMnemonicsPath,
      handleExternalAddresses
    ]
  }

  public parse(config: HardhatConfig, initialConfig: HardhatUserConfig): void {
    this.transformers.forEach((transformer) => transformer(config, initialConfig))
  }
}

function handleMnemonicsPath(config: HardhatConfig, userConfig: HardhatUserConfig) {
  config.paths.mnemonicsDir = handlePath(userConfig?.paths?.mnemonicsDir,
    "mnemonics/",
    config.paths.root
  )
  config.paths.mnemonicsFile = handlePath(null,
    MNEMONIC_PATH,
    config.paths.root
  )
}

function handlePath(userConfigPath: string | null | undefined, defaultPath: string, root: string): string {
  let configPath: string = "";
  if (!Boolean(configPath)) {
    configPath = defaultPath;
  }
  if (!path.isAbsolute(configPath)) {
    configPath = path.normalize(path.join(root, configPath));
  }
  return configPath;
}

function handleExternalAddresses(config: HardhatConfig, userConfig: HardhatUserConfig) {
  config.externalAddresses = userConfig.externalAddresses ?? {}
}



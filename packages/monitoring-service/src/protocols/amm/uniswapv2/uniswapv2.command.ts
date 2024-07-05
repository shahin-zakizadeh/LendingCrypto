import { Command, CommandRunner, Option } from 'nest-commander';
import { UniswapV2Service } from './uniswapv2.service';
import validator from 'validator';
import isInt = validator.isInt;
import isEthereumAddress = validator.isEthereumAddress;

@Command({
  name: 'uniswapv2',
  arguments: '<chainId> <paidAddress>',
  description: 'Handle price monitoring',
})
export class UniswapV2Command extends CommandRunner {
  constructor(private ammService: UniswapV2Service) {
    super();
  }

  async run(
    passedParams: string[],
    options?: Record<string, any>,
  ): Promise<void> {
    const [chainIdArg, addressArg] = passedParams;
    const { enabled, priority } = options;
    if (!isInt(chainIdArg)) {
      throw new Error('Chain Id must be integer');
    }
    if (!isEthereumAddress(addressArg)) {
      throw new Error('Pair address is not an eth address');
    }
    const priceSource = await this.ammService.registerUniV2Pair(
      Number(chainIdArg),
      addressArg,
      priority,
      enabled,
    );
    console.log(`Registered pair. ID: ${priceSource.id}`);
  }

  @Option({
    flags: '-e, --enabled [boolean]',
    description: 'Monitor this price source',
  })
  parseType(val: string) {
    return JSON.parse(val);
  }

  @Option({
    flags: '-n, --number [number]',
    description: 'A basic number parser',
  })
  parseNumber(val: string): number {
    return Number(val);
  }
}

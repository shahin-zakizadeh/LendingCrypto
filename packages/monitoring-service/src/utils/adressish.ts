export interface IAddressEntity {
  address: string;
}

export type addressish<T extends IAddressEntity> = T | string;

export const address = <T extends IAddressEntity>(
  ish: addressish<T>,
): string => {
  return typeof ish === 'string' ? ish : ish.address;
};

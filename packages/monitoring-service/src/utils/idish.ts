export interface IEntity {
  id: number;
}

export type Idish<T extends IEntity> = T | number;

export const id = <T extends IEntity>(idish: Idish<T>): number => {
  return typeof idish === 'number' ? idish : idish.id;
};

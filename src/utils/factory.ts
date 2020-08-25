import { IBalance } from '../interface/app';

export function makeBalance(): IBalance<number> {
  return {
    pendingCredit: 0,
    pendingDebit: 0,
    clearedCredit: 0,
    clearedDebit: 0,
  };
}

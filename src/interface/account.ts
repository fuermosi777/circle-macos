import { Currency } from './currency';

export interface IAccount {
  id?: number;
  name: string;
  currency: Currency;
  balance: number;
  isCredit: boolean;
}

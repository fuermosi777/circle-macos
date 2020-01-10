import { Currency } from './currency';
// Never delete fields for compatibility.
export interface IProfile {
  showBalanceOnSide: boolean;
  mainCurrency: Currency;
}

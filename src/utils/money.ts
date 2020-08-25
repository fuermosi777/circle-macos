import Dinero from 'dinero.js';

import { IBalance } from '../interface/app';
import { Currency, IExchangeRawResult } from '../interface/currency';
import { Transaction, TransactionStatus, TransactionType } from '../models/transaction';
import { makeBalance } from './factory';
import { logger } from './logger';

export function toDinero(amount: number, currency: any): Dinero.Dinero {
  return Dinero({
    amount: Math.round(amount * 100),
    currency,
    precision: 2,
  });
}

export function fromDinero(d: Dinero.Dinero): number {
  return d.getAmount() / 100;
}

export function convertTo(
  base: Currency,
  source: Dinero.Dinero,
  rates: IExchangeRawResult,
): Dinero.Dinero {
  if (base === source.getCurrency()) {
    return source;
  }
  if (!Reflect.has(rates.rates, source.getCurrency())) {
    logger.warn(`${source.getCurrency()} is not found in rates.`);
    return toDinero(0, base);
  }

  let rate = Reflect.get(rates.rates, source.getCurrency());
  let to = toDinero(fromDinero(source), base);
  to = to.divide(rate);

  return to;
}

// Get complex balance from a list of transactions, regardless of the currency.
export function calculateBalance(
  transactions: Transaction[],
  initialBalance?: IBalance<number>,
): IBalance<number> {
  let balance: IBalance<number> = initialBalance || makeBalance();
  for (const transaction of transactions) {
    if (transaction.type === TransactionType.Credit) {
      if (transaction.status === TransactionStatus.Cleared) {
        balance.clearedCredit += transaction.amount;
      } else if (transaction.status === TransactionStatus.Pending) {
        balance.pendingCredit += transaction.amount;
      }
    } else if (transaction.type === TransactionType.Debit) {
      if (transaction.status === TransactionStatus.Cleared) {
        balance.clearedDebit += transaction.amount;
      } else if (transaction.status === TransactionStatus.Pending) {
        balance.pendingDebit += transaction.amount;
      }
    }
  }
  return balance;
}

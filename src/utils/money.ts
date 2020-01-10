import Dinero from 'dinero.js';

import { Currency, IExchangeRawResult } from '../interface/currency';
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

import Dinero from 'dinero.js';

export function toDinero(amount: number, currency: any): Dinero.Dinero {
  return Dinero({
    amount: Math.round(amount * 100),
    currency,
    precision: 2,
  });
}

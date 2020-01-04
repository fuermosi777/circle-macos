import Dinero from 'dinero.js';
import * as React from 'react';

import { Transaction, TransactionType } from '../models/transaction';
import { isEmpty, notEmpty } from '../utils/helper';
import { logger } from '../utils/logger';
import { toDinero } from '../utils/money';

interface IProps {
  // Group header or transaction item.
  data: string | Transaction;
  onContextMenu?(transactionId: number): void;
}

export const TransactionItem = (props: IProps) => {
  function handleContextMenu() {
    if (typeof props.data === 'string') {
      return;
    } else {
      props.onContextMenu(props.data.id);
    }
  }
  function getTitle(): string {
    if (typeof props.data === 'string') {
      return '';
    }
    if (isEmpty(props.data.sibling) && notEmpty(props.data.payee)) {
      // TODO: fix "income".
      return props.data.payee.name || 'Income';
    } else if (props.data.type === TransactionType.Credit) {
      if (notEmpty(props.data.to)) {
        return `Transfer to ${props.data.to.name}`;
      }
    } else if (props.data.type === TransactionType.Debit) {
      if (notEmpty(props.data.from)) {
        return `Transfer from ${props.data.from.name}`;
      }
    }
  }
  function getAmount(): string {
    if (typeof props.data === 'string') {
      return '';
    }
    if (isEmpty(props.data.account)) {
      logger.warn(`Data's account is empty.`);
      return '';
    }
    let amount = toDinero(props.data.amount, props.data.account.currency);
    if (props.data.type === TransactionType.Credit) {
      amount = amount.multiply(-1);
    }
    return amount.toFormat('$0,0.00');
  }
  return (
    <div className='TransactionItem' onContextMenu={handleContextMenu}>
      {typeof props.data === 'string' ? (
        <div className='header'>{props.data}</div>
      ) : (
        <div className='item'>
          <div className='content'>
            <div className='title'>{getTitle()}</div>
            <div className='subtitle'>{props.data.category && props.data.category.name}</div>
          </div>
          <div className='info'>{getAmount()}</div>
        </div>
      )}
    </div>
  );
};

import Dinero from 'dinero.js';
import * as React from 'react';

import { ITransactionInstance, TransactionType } from '../interface/transaction';
import { notEmpty } from '../utils/helper';

interface IProps {
  // Group header or transaction item.
  data: string | ITransactionInstance;
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
    if (notEmpty(props.data.payee)) {
      return props.data.payee.name;
    } else if (props.data.type === TransactionType.Credit) {
      if (notEmpty(props.data.toAccount)) {
        return `Transfer to ${props.data.toAccount.name}`;
      }
    } else if (props.data.type === TransactionType.Debit) {
      if (notEmpty(props.data.fromAccount)) {
        return `Transfer from ${props.data.fromAccount.name}`;
      }
    }
  }
  function getAmount(): string {
    if (typeof props.data === 'string') {
      return '';
    }
    let amount = Dinero({
      amount: props.data.amount,
      precision: 0,
      currency: props.data.account.currency as any,
    });
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

import Dinero from 'dinero.js';
import * as React from 'react';

import { Transaction, TransactionStatus, TransactionType } from '../models/transaction';
import { isEmpty, notEmpty } from '../utils/helper';
import { logger } from '../utils/logger';
import { toDinero } from '../utils/money';

interface IProps {
  // Group header or transaction item.
  data: string | Transaction;
  selected: boolean;
  onClick(transactionId: number): void;
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
  function handleClick() {
    if (typeof props.data === 'string') {
      return;
    } else {
      props.onClick(props.data.id);
    }
  }
  function getTitle(): string {
    if (typeof props.data === 'string') {
      return '';
    }
    if (isEmpty(props.data.sibling)) {
      // Non-transfer transactions.
      if (props.data.type === TransactionType.Debit) {
        return 'Income';
      }
      if (notEmpty(props.data.payee)) {
        return props.data.payee.name;
      }
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
    <div
      className={`TransactionItem ${props.selected ? 'selected' : ''}`}
      onContextMenu={handleContextMenu}
      onClick={handleClick}>
      {typeof props.data === 'string' ? (
        <div className='header'>{props.data}</div>
      ) : (
        <div className='item'>
          <div className='content'>
            {props.data.status === TransactionStatus.Pending && <div className='indicator'></div>}
            <div className='title-group'>
              <div className='title'>{getTitle()}</div>
              <div className='subtitle'>{props.data.category && props.data.category.name}</div>
            </div>
          </div>
          <div className='info'>{getAmount()}</div>
        </div>
      )}
    </div>
  );
};

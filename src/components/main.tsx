import { observer } from 'mobx-react';
import * as React from 'react';

import { SideItemType, kAllAccountsIndex } from '../interface/app';
import { rootStore } from '../stores/root_store';
import { isEmpty } from '../utils/helper';
import { logger } from '../utils/logger';
import { toDinero } from '../utils/money';
import { convertTo } from '../utils/money';
import { TransactionList } from './transaction_list';

export const Main = observer(() => {
  function getBalance(): string {
    if (rootStore.app.exchangeRateStatus !== 'done') {
      return '';
    }
    if (rootStore.app.selectedSideItem.type !== SideItemType.Account) {
      return '';
    }
    if (rootStore.app.selectedSideItem.index === kAllAccountsIndex) {
      const base = rootStore.profile.profile.mainCurrency;
      const rates = rootStore.app.exchangeRates;
      const zero = toDinero(0, base);
      let cleared = toDinero(0, base);
      let pending = toDinero(0, base);
      for (let account of rootStore.account.data) {
        const creditOp = account.isCredit ? 'add' : 'subtract';
        const debitOp = account.isCredit ? 'subtract' : 'add';
        cleared = cleared[creditOp](
          convertTo(base, rootStore.account.totalCreditCleared.get(account.id, zero), rates),
        );
        cleared = cleared[debitOp](
          convertTo(base, rootStore.account.totalDebitCleared.get(account.id, zero), rates),
        );
        pending = pending[creditOp](
          convertTo(base, rootStore.account.totalCreditPending.get(account.id, zero), rates),
        );
        pending = pending[debitOp](
          convertTo(base, rootStore.account.totalDebitPending.get(account.id, zero), rates),
        );
      }
      return `Cleared: ${cleared.toFormat('$0,0.00')}; Pending: ${cleared
        .add(pending)
        .toFormat('$0,0.00')}`;
    } else {
      const accounts = rootStore.account.data.filter(
        (account) => account.id === rootStore.app.selectedSideItem.index,
      );
      if (isEmpty(accounts)) {
        logger.warn(
          `Failed to get balances: failed to find account with ID ${rootStore.app.selectedSideItem.index}.`,
        );
        return '';
      }
      const account = accounts[0];

      // Start with debit account.
      let cleared = rootStore.account.totalDebitCleared
        .get(account.id)
        .subtract(rootStore.account.totalCreditCleared.get(account.id));
      let pending = rootStore.account.totalDebitPending
        .get(account.id)
        .subtract(rootStore.account.totalCreditPending.get(account.id));
      if (account.isCredit) {
        cleared = cleared.multiply(-1);
        pending = pending.multiply(-1);
      }

      return `Cleared: ${cleared.toFormat('$0,0.00')}; Pending: ${cleared
        .add(pending)
        .toFormat('$0,0.00')}`;
    }
  }
  return (
    <div className='Main' style={{ width: rootStore.app.mainWidth }}>
      <div className='top'>
        <div className='top-item total'>{getBalance()}</div>
      </div>
      <TransactionList />
    </div>
  );
});

import { observer } from 'mobx-react';
import * as React from 'react';

import { rootStore } from '../stores/root_store';
import { TransactionList } from './transaction_list';

export const Main = observer(() => {
  return (
    <div className='Main' style={{ width: rootStore.app.mainWidth }}>
      <div className='top'></div>
      <TransactionList />
    </div>
  );
});

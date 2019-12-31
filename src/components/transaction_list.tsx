import { remote } from 'electron';
import { observer } from 'mobx-react';
import * as React from 'react';

import { rootStore } from '../stores/root_store';
import { EditTransaction } from './edit_transaction';
import { TransactionItem } from './transaction_item';

interface IProps {
  accountId?: number;
}

export const TransactionList = observer((props: IProps) => {
  function handleItemContextMenu(transactionId: number) {
    const menu = new remote.Menu();
    menu.append(
      new remote.MenuItem({
        label: 'Edit...',
        click() {
          rootStore.modal.openModal(
            <EditTransaction
              onCancel={() => rootStore.modal.closeModal()}
              transactionId={transactionId}
            />,
          );
        },
      }),
    );

    menu.popup();
  }

  return (
    <div className='TransactionList' style={{ height: rootStore.app.windowHeight - 40 }}>
      {rootStore.transaction.groupedData.map((dotum, index) => (
        <React.Fragment key={typeof dotum === 'string' ? dotum : dotum.id}>
          {/* Divider between groups. */}
          {index > 0 && typeof dotum === 'string' && <div className='divider'></div>}
          <TransactionItem
            data={dotum}
            onContextMenu={(transactionId) => handleItemContextMenu(transactionId)}
          />
        </React.Fragment>
      ))}
    </div>
  );
});

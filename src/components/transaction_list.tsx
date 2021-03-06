import { remote } from 'electron';
import { observer } from 'mobx-react';
import * as React from 'react';

import { rootStore } from '../stores/root_store';
import { isNearBottom, throttle } from '../utils/helper';
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

    menu.append(
      new remote.MenuItem({
        label: 'Delete',
        async click() {
          const result = await remote.dialog.showMessageBox({
            type: 'question',
            message: 'Are you sure you want to delete this transaction?',
            buttons: ['Delete', 'Cancel'],
          });
          if (result.response === 0 /* Delete */) {
            await rootStore.transaction.delete(transactionId);
          }
        },
      }),
    );

    menu.popup();
  }

  function handleScrolled(target: HTMLDivElement) {
    if (isNearBottom(target)) {
      rootStore.transaction.loadMore();
    }
  }
  const handleScrolledOp = throttle(handleScrolled);

  return (
    <div
      className='TransactionList'
      style={{ height: rootStore.app.windowHeight - 40 }}
      onScroll={(e) => handleScrolledOp(e.target)}>
      {rootStore.transaction.groupedData.map((dotum, index) => (
        <React.Fragment key={typeof dotum === 'string' ? dotum : dotum.id}>
          {/* Divider between groups. */}
          {index > 0 && typeof dotum === 'string' && <div className='divider'></div>}
          <TransactionItem
            data={dotum}
            selected={
              typeof dotum !== 'string' && rootStore.transaction.selectedTransactionId === dotum.id
            }
            onClick={(id) => rootStore.transaction.selectTransaction(id)}
            onContextMenu={(transactionId) => handleItemContextMenu(transactionId)}
          />
        </React.Fragment>
      ))}
    </div>
  );
});

import { remote } from 'electron';
import { observer } from 'mobx-react';
import * as React from 'react';
import * as Icon from 'react-feather';

import db from '../database';
import { rootStore } from '../stores/root_store';
import { stopEvent } from '../utils/component_utils';
import { EditAccount } from './edit_account';
import { EditTransaction } from './edit_transaction';
import { ImportFlow } from './import_flow';
import { InvisibleButton } from './invisible_button';

export const SideBorder = () => {
  const [isDragging, setDragging] = React.useState(false);

  function handleMouseDown() {
    startDragging();
  }

  function handleMouseMove(e: any) {
    if (isDragging) {
      rootStore.app.updateSideWidth(e.pageX);
    }
  }

  function handleMouseUp() {
    endDragging();
  }

  function startDragging() {
    setDragging(true);
  }

  function endDragging() {
    setDragging(false);
  }

  React.useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return function cleanup() {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  });

  return (
    <div
      className='SideBorder'
      onDragOver={stopEvent}
      onDrop={stopEvent}
      onMouseDown={handleMouseDown}>
      {isDragging && <div className='dragging-overlay'></div>}
    </div>
  );
};

interface IItemProps {
  icon?: JSX.Element;
  label: string;
  iconClassName: string;
  info?: string;
  onContextMenu?(): void;
}

const SideItem = (props: IItemProps) => {
  return (
    <div className='SideItem' onContextMenu={props.onContextMenu}>
      {props.info && <div className='side-info'>{props.info}</div>}
      <div className='content'>
        {props.icon && <span className={`side-icon ${props.iconClassName}`}>{props.icon}</span>}
        <span className='side-title'>{props.label}</span>
      </div>
    </div>
  );
};

export const Side = observer(() => {
  function handleAddNewClick() {
    const menu = new remote.Menu();
    menu.append(
      new remote.MenuItem({
        label: 'New Account',
        click() {
          rootStore.modal.openModal(<EditAccount onCancel={() => rootStore.modal.closeModal()} />);
        },
      }),
    );
    // Only add this option when at lease one account exists.
    if (rootStore.account.data.length > 0) {
      menu.append(
        new remote.MenuItem({
          label: 'New Transaction',
          click() {
            rootStore.modal.openModal(
              <EditTransaction onCancel={() => rootStore.modal.closeModal()} />,
            );
          },
        }),
      );
    }

    menu.popup();
  }

  function handleMoreClick() {
    const menu = new remote.Menu();
    menu.append(
      new remote.MenuItem({
        label: 'Import',
        click() {
          rootStore.modal.openModal(<ImportFlow onCancel={() => rootStore.modal.closeModal()} />);
        },
      }),
    );

    menu.popup();
  }

  function handleContextMenu(accountId: number) {
    const menu = new remote.Menu();
    menu.append(
      new remote.MenuItem({
        label: 'Edit...',
        click() {
          rootStore.modal.openModal(
            <EditAccount onCancel={() => rootStore.modal.closeModal()} accountId={accountId} />,
          );
        },
      }),
    );
    menu.append(
      new remote.MenuItem({
        label: 'Delete',
        async click() {
          let result = await remote.dialog.showMessageBox({
            type: 'question',
            message: 'Are you sure you want to delete this account?',
            buttons: ['Delete', 'Cancel'],
          });
          if (result.response !== 0 /* Delete */) {
            return;
          }
          const transactions = await db.transactions.where({ accountId }).toArray();
          if (transactions.length > 0) {
            result = await remote.dialog.showMessageBox({
              type: 'question',
              message: `Will also delete ${transactions.length} transactions associated with this account.`,
              buttons: ['OK', 'Cancel'],
            });
            if (result.response !== 0) {
              return;
            }
            // Start deletion.
            for (const transaction of transactions) {
              await rootStore.transaction.delete(transaction.id);
            }
            await rootStore.account.delete(accountId);
          } else {
            // No associated transactions, just delete it.
            await rootStore.account.delete(accountId);
          }
        },
      }),
    );

    menu.popup();
  }

  return (
    <div className='Side' style={{ width: rootStore.app.sideWidth }}>
      <div className='side-top'></div>
      <div className='side-item-group'>
        <SideItem icon={<Icon.Star />} iconClassName='account-header' label='Accounts' />
        {rootStore.account.data.map((account) => {
          return (
            <SideItem
              key={account.id}
              icon={<Icon.CreditCard />}
              iconClassName='account'
              label={account.name}
              info={rootStore.account.getRuningBalance(account.id)}
              onContextMenu={() => handleContextMenu(account.id)}
            />
          );
        })}
      </div>

      <div className='side-bottom'>
        <InvisibleButton icon={<Icon.Plus />} label='New' onClick={handleAddNewClick} />
        <InvisibleButton icon={<Icon.MoreHorizontal />} label='More' onClick={handleMoreClick} />
      </div>
      <SideBorder />
    </div>
  );
});

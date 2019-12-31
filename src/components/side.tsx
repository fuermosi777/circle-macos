import Dinero from 'dinero.js';
import { remote } from 'electron';
import { observer } from 'mobx-react';
import * as React from 'react';
import * as Icon from 'react-feather';

import { IAccount } from '../interface/account';
import { TransactionType } from '../interface/transaction';
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

    menu.popup();
  }
  return (
    <div className='Side' style={{ width: rootStore.app.sideWidth }}>
      <div className='side-top'></div>
      <div className='side-item-group'>
        <SideItem icon={<Icon.Star />} iconClassName='account-header' label='Accounts' />
        {rootStore.account.data.map((account: IAccount) => {
          let rBalance = Dinero({
            amount: account.balance,
            currency: account.currency as any,
            precision: 0,
          });
          for (const transaction of rootStore.transaction.data) {
            if (transaction.accountId !== account.id) {
              continue;
            }
            const amount = Dinero({
              amount: transaction.amount,
              currency: account.currency as any,
              precision: 0,
            });
            if (transaction.type === TransactionType.Credit) {
              rBalance = rBalance.subtract(amount);
            } else if (transaction.type === TransactionType.Debit) {
              rBalance = rBalance.add(amount);
            }
          }
          return (
            <SideItem
              key={account.id}
              icon={<Icon.CreditCard />}
              iconClassName='account'
              label={account.name}
              info={rBalance.toFormat('$0,0.00')}
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

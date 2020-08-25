import { remote } from 'electron';
import { observer } from 'mobx-react';
import * as React from 'react';
import * as Icon from 'react-feather';
import { getRepository as repo } from 'typeorm';

import { ISideItem, ReportsItem, SideItemType, kAllAccountsIndex } from '../interface/app';
import { Account } from '../models/account';
import { rootStore } from '../stores/root_store';
import { stopEvent } from '../utils/component_utils';
import { isEmpty, throttle } from '../utils/helper';
import { toDinero } from '../utils/money';
import { EditAccount } from './edit_account';
import { EditTransaction } from './edit_transaction';
import { InvisibleButton } from './invisible_button';

const allAccountSideItem = {
  type: SideItemType.Account,
  index: kAllAccountsIndex,
};

const reportsAssetsItem = {
  type: SideItemType.Reports,
  index: ReportsItem.Assets,
};

export const SideBorder = () => {
  const [isDragging, setDragging] = React.useState(false);

  function handleMouseDown() {
    startDragging();
  }

  function handleMouseMove(e: any) {
    if (isDragging) {
      updateSideWidthOp(e.pageX);
    }
  }

  function updateSideWidth(value: number) {
    rootStore.app.updateSideWidth(value);
  }
  const updateSideWidthOp = throttle(updateSideWidth);

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
  selected?: boolean;
  onSelect?(): void;
  onContextMenu?(): void;
  childItems?: JSX.Element[];
}

const SideItem = (props: IItemProps) => {
  const [showChildItems, setShowChildItems] = React.useState(true);
  return (
    <div className='SideItem'>
      <div
        className={`header ${props.selected ? 'selected' : ''}`}
        onClick={props.onSelect}
        onContextMenu={props.onContextMenu}>
        {props.info && <div className='side-info'>{props.info}</div>}
        {isEmpty(props.info) && props.childItems && (
          <div
            className='side-info expand-icon'
            onMouseDown={() => setShowChildItems(!showChildItems)}>
            {showChildItems ? <Icon.ChevronUp /> : <Icon.ChevronDown />}
          </div>
        )}
        <div className='content'>
          {props.icon && <span className={`side-icon ${props.iconClassName}`}>{props.icon}</span>}
          <span className='side-title'>{props.label}</span>
        </div>
      </div>
      <div className='child-items'>{showChildItems && props.childItems}</div>
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
          const account = await repo(Account).findOne(accountId, {
            relations: ['transactions'],
          });
          if (account.transactions.length > 0) {
            result = await remote.dialog.showMessageBox({
              type: 'question',
              message: `Will also delete ${account.transactions.length} transactions associated with this account.`,
              buttons: ['OK', 'Cancel'],
            });
            if (result.response !== 0) {
              return;
            }
            // Start bulk deletion.
            await rootStore.transaction.bulkDelete(
              account.transactions.map((transaction) => transaction.id),
            );

            await repo(Account).delete(accountId);
          } else {
            // No associated transactions, just delete it.
            await repo(Account).delete(accountId);
          }

          await rootStore.account.freshLoad();
        },
      }),
    );

    menu.popup();
  }

  function getBalance(account: Account): string {
    if (!rootStore.profile.profile.showBalanceOnSide) {
      return '';
    }
    if (
      !rootStore.account.totalCreditPending.has(account.id) &&
      !rootStore.account.totalCreditCleared.has(account.id) &&
      !rootStore.account.totalDebitPending.has(account.id) &&
      !rootStore.account.totalDebitCleared.has(account.id)
    ) {
      return '';
    }
    let result = toDinero(account.balance, account.currency);

    const totalCredit = rootStore.account.totalCreditCleared
      .get(account.id)
      .add(rootStore.account.totalCreditPending.get(account.id));

    const totalDebit = rootStore.account.totalDebitCleared
      .get(account.id)
      .add(rootStore.account.totalDebitPending.get(account.id));

    if (account.isCredit) {
      result = result.add(totalCredit).subtract(totalDebit);
    } else {
      result = result.subtract(totalCredit).add(totalDebit);
    }
    return result.toFormat('$0,0.00');
  }

  function handleSideItemSelect(sideItem: ISideItem) {
    rootStore.app.updateSelectedSideItem(sideItem);
    rootStore.transaction.freshLoad(/* sync = */ false);
  }

  function matchSelectedSideItem(item: ISideItem) {
    return (
      rootStore.app.selectedSideItem.type === item.type &&
      rootStore.app.selectedSideItem.index === item.index
    );
  }

  function renderAccounts() {
    return rootStore.account.data.map((account) => {
      const sideItem: ISideItem = {
        type: SideItemType.Account,
        index: account.id,
      };

      return (
        <SideItem
          key={account.id}
          icon={<Icon.CreditCard />}
          iconClassName='account'
          label={account.name}
          info={getBalance(account)}
          onContextMenu={() => handleContextMenu(account.id)}
          onSelect={() => handleSideItemSelect(sideItem)}
          selected={matchSelectedSideItem(sideItem)}
        />
      );
    });
  }

  return (
    <div className='Side' style={{ width: rootStore.app.sideWidth }}>
      <div className='side-top'></div>
      <div className='side-body'>
        <div className='side-group'>
          <SideItem
            icon={<Icon.Star />}
            iconClassName='account-header'
            label='Accounts'
            onSelect={() => handleSideItemSelect(allAccountSideItem)}
            selected={matchSelectedSideItem(allAccountSideItem)}
            childItems={renderAccounts()}
          />
        </div>
        <div className='side-group'>
          <SideItem
            icon={<Icon.Activity />}
            iconClassName='reports-header'
            label='Reports'
            childItems={[
              <SideItem
                key={ReportsItem.Assets}
                icon={<Icon.DollarSign />}
                iconClassName='assets-header'
                label='Wealth'
                onSelect={() => handleSideItemSelect(reportsAssetsItem)}
                selected={matchSelectedSideItem(reportsAssetsItem)}
              />,
            ]}
          />
        </div>
      </div>

      <div className='side-bottom'>
        <InvisibleButton icon={<Icon.Plus />} label='New' onClick={handleAddNewClick} />
      </div>
      <SideBorder />
    </div>
  );
});

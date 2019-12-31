import * as React from 'react';

import { IAccount } from '../interface/account';
import { Currency, CurrencyLabel } from '../interface/currency';
import { rootStore } from '../stores/root_store';
import { isEmpty } from '../utils/helper';
import { logger } from '../utils/logger';
import { Button } from './button';
import { Checkbox } from './checkbox';
import { Gap } from './gap';
import { Input } from './input';
import { Select } from './select';

interface IProps {
  accountId?: number;
  onCancel(): void;
}

export const EditAccount = (props: IProps) => {
  const [name, setName] = React.useState('');
  const [balance, setBalance] = React.useState('');
  const [currency, setCurrency] = React.useState(Currency.USD);
  const [isCredit, setCredit] = React.useState(false);

  React.useEffect(() => {
    let cancel = false;
    const getAccount = async () => {
      if (cancel || isEmpty(props.accountId)) {
        return;
      }
      const account = await rootStore.account.get({ id: props.accountId });
      setName(account.name);
      setBalance(String(account.balance));
      setCurrency(account.currency);
      setCredit(account.isCredit);
    };
    getAccount();
    return () => {
      cancel = true;
    };
  }, []);

  function handleBalanceChange(value: string) {
    // Positive or negative numbers.
    if (/^-?\d*\.?\d*$/.test(value)) {
      setBalance(value);
    }
  }

  function isDoneClickable() {
    return name && balance;
  }

  async function handleDone() {
    try {
      let account: IAccount;
      if (props.accountId) {
        account = await rootStore.account.get({ id: props.accountId });
        account.name = name;
        account.balance = Number(balance);
        account.currency = currency;
        account.isCredit = isCredit;
      } else {
        account = {
          name,
          balance: Number(balance),
          currency,
          isCredit,
        };
      }
      await rootStore.account.put(account);
      props.onCancel();
    } catch (err) {
      logger.error(err);
    }
  }

  return (
    <div className='EditAccount'>
      <Input placeholder='Account Name' value={name} onChange={setName} />
      <Gap size={15} />
      <Input placeholder='Starting Balance' value={balance} onChange={handleBalanceChange} />
      <Gap size={15} />
      <Select onChange={(value: Currency) => setCurrency(value)} value={currency}>
        {Object.keys(Currency).map((curr: keyof typeof Currency) => (
          <Select.Option key={curr} value={curr} label={CurrencyLabel[curr]} />
        ))}
      </Select>
      <Gap size={15} />
      <Checkbox label='Credit Account' isChecked={isCredit} onChange={setCredit} />
      <Gap size={15} />
      <div className='button-group'>
        <Button label='Cancel' onClick={props.onCancel} />
        <Gap vertical size={10} />
        <Button label='Done' disabled={!isDoneClickable()} onClick={handleDone} />
      </div>
    </div>
  );
};

import { observer } from 'mobx-react';
import * as React from 'react';
import { getRepository as repo } from 'typeorm';

import { Account } from '../models/account';
import { CategoryType } from '../models/category';
import { Payee } from '../models/payee';
import { Transaction, TransactionStatus, TransactionType } from '../models/transaction';
import { rootStore } from '../stores/root_store';
import { isEmpty, notEmpty } from '../utils/helper';
import { logger } from '../utils/logger';
import { addOrEditTransaction } from '../utils/operations';
import { Button } from './button';
import { Checkbox } from './checkbox';
import { DatePicker } from './date_picker';
import { Gap } from './gap';
import { Input } from './input';
import { InputField } from './input_field';
import { Radio } from './radio';
import { Select } from './select';

interface IProps {
  transactionId?: number;

  onCancel(): void;
}

export const EditTransaction = observer((props: IProps) => {
  const defaultAccount = rootStore.account.data[0];
  const accountNames = rootStore.account.data.map((item) => item.name);

  const [type, setType] = React.useState(TransactionType.Credit);
  const [amount, setAmount] = React.useState('');
  const [payeeName, setPayeeName] = React.useState('');
  const [fromName, setFromName] = React.useState(defaultAccount.name);
  const [toName, setToName] = React.useState(defaultAccount.name);
  const [categoryName, setCategoryName] = React.useState('');
  const [accountName, setAccountName] = React.useState(defaultAccount.name);
  const [date, setDate] = React.useState(new Date());
  const [status, setStatus] = React.useState(TransactionStatus.Pending);
  const [note, setNote] = React.useState('');

  const [quickCategories, setQuickCategories] = React.useState([]);
  const [quickAccounts, setQuickAccounts] = React.useState([]);

  React.useEffect(() => {
    let cancel = false;

    const getTransaction = async () => {
      if (cancel || isEmpty(props.transactionId)) {
        return;
      }
      const transaction = await repo(Transaction).findOne(props.transactionId, {
        relations: [
          'account',
          'payee',
          'payee.categories',
          'payee.accounts',
          'category',
          'from',
          'to',
          'sibling',
        ],
      });
      if (!transaction) {
        logger.warn(
          `Try to load a transaction for editing but did not find it: ${props.transactionId}`,
        );
        return;
      }
      // Found a transaction, load to states.
      if (transaction.payee) {
        setType(transaction.type);
        setAmount(String(transaction.amount));
        setPayeeName(transaction.payee.name);
        setQuickCategories(transaction.payee.categories.map((cate) => cate.name));
        setQuickAccounts(transaction.payee.accounts.map((acct) => acct.name));
      }
      if (transaction.from) {
        setFromName(transaction.from.name);
      }
      if (transaction.to) {
        setToName(transaction.to.name);
      }
      if (transaction.category) {
        setCategoryName(transaction.category.name);
      }
      setAccountName(transaction.account.name);
      setDate(transaction.date);
      setStatus(transaction.status);
      setNote(transaction.note);
    };

    getTransaction();

    return () => {
      cancel = true;
    };
  }, []);

  function handleTypeChange(type: TransactionType) {
    setType(type);
    setCategoryName('');
  }

  function handleAmountChange(value: string) {
    // Positive numbers.
    if (/^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  }

  function isDoneClickable() {
    if (amount === '0') {
      return false;
    }
    if (type === TransactionType.Credit) {
      if (!amount || !payeeName || !categoryName || !accountName || !date) {
        return false;
      }
    }
    if (type === TransactionType.Debit) {
      if (!amount || !categoryName || !accountName || !date) {
        return false;
      }
    }

    if (type === TransactionType.Transfer && fromName === toName) {
      return false;
    }

    return true;
  }

  async function handleDoneClick() {
    try {
      // Create new transaction. For exp/income type create one. For transfer create two.
      await addOrEditTransaction(
        type,
        Number(amount),
        accountName,
        date,
        status,
        fromName,
        toName,
        categoryName,
        payeeName,
        false,
        note,
        props.transactionId,
      );
      props.onCancel();
    } catch (err) {
      logger.error(`Failed to create a new transaction.`, err);
    }
  }

  async function handlePayeeNameChange(name: string) {
    try {
      setPayeeName(name);
      // If no payee name, reset quick action options.
      if (isEmpty(name)) {
        setQuickCategories([]);
        setQuickAccounts([]);
        return;
      }
      const payee = await repo(Payee).findOne({
        where: { name },
        relations: ['categories', 'accounts'],
      });
      if (notEmpty(payee)) {
        setQuickCategories(payee.categories.map((item) => item.name));
        setQuickAccounts(payee.accounts.map((item) => item.name));
        if (payee.categories.length > 0) {
          setCategoryName(payee.categories[0].name);
        }
        if (payee.accounts.length > 0) {
          setAccountName(payee.accounts[0].name);
        }
      } else {
        setQuickCategories([]);
        setQuickAccounts([]);
      }
    } catch (err) {
      logger.error(err);
    }
  }

  return (
    <div className='EditTransaction'>
      <InputField>
        <Radio selectedValue={type} onChange={handleTypeChange}>
          <Radio.Option label='Expense' value={TransactionType.Credit} />
          <Radio.Option label='Income' value={TransactionType.Debit} />
          <Radio.Option label='Transfer' value={TransactionType.Transfer} />
        </Radio>
      </InputField>

      <InputField>
        <Input placeholder='Amount' value={amount} onChange={handleAmountChange} />
      </InputField>

      {type === TransactionType.Transfer && (
        <InputField>
          <Input
            label='From'
            value={accountName}
            onChange={(value) => setFromName(value)}
            options={accountNames}
            filterOptions={false}
            isSelect
          />
        </InputField>
      )}

      {/* Enter or select Payee. */}
      {type === TransactionType.Credit && (
        <InputField>
          <Input
            placeholder='Payee'
            value={payeeName}
            onChange={handlePayeeNameChange}
            options={rootStore.payee.data.map((pe) => pe.name)}
          />
        </InputField>
      )}

      {type === TransactionType.Transfer ? (
        <InputField>
          <Input
            label='To'
            value={accountName}
            onChange={(value) => setToName(value)}
            options={accountNames}
            filterOptions={false}
            isSelect
          />
        </InputField>
      ) : (
        <InputField>
          <Input
            placeholder='Cateogry'
            value={categoryName}
            onChange={setCategoryName}
            options={rootStore.category.data
              // Only want categories for a certain type.
              .filter(
                (cat) =>
                  cat.type ===
                  (type === TransactionType.Credit ? CategoryType.Expense : CategoryType.Income),
              )
              .map((cat) => cat.name)}
            // Only show quick option in credit.
            quickOptions={type === TransactionType.Credit && quickCategories}
          />
        </InputField>
      )}

      {/* Select related account associated with this transaction. */}
      {type !== TransactionType.Transfer && (
        <InputField>
          <Input
            value={accountName}
            onChange={(value) => setAccountName(value)}
            options={accountNames}
            filterOptions={false}
            isSelect
            quickOptions={quickAccounts}
          />
        </InputField>
      )}

      <InputField>
        <DatePicker value={date} onChange={setDate} />
      </InputField>

      <InputField>
        <Checkbox
          isChecked={status === TransactionStatus.Cleared}
          label='Cleared'
          onChange={(isChecked) =>
            setStatus(isChecked ? TransactionStatus.Cleared : TransactionStatus.Pending)
          }
        />
      </InputField>
      <InputField>
        <Input placeholder='Add some notes' value={note} onChange={setNote} />
      </InputField>
      <div className='button-group'>
        <Button label='Cancel' onClick={props.onCancel} />
        <Gap vertical size={10} />
        <Button label='Done' onClick={handleDoneClick} disabled={!isDoneClickable()} />
      </div>
    </div>
  );
});

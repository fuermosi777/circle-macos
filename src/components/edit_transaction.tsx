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

const kDefaultAccountId = 1;

interface IProps {
  transactionId?: number;

  onCancel(): void;
}

export const EditTransaction = observer((props: IProps) => {
  const [type, setType] = React.useState(TransactionType.Credit);
  const [amount, setAmount] = React.useState('');
  const [payeeName, setPayeeName] = React.useState('');
  const [from, setFrom] = React.useState(kDefaultAccountId);
  const [to, setTo] = React.useState(kDefaultAccountId);
  const [categoryName, setCategoryName] = React.useState('');
  const [accountId, setAccountId] = React.useState(kDefaultAccountId);
  const [date, setDate] = React.useState(new Date());
  const [status, setStatus] = React.useState(TransactionStatus.Pending);
  const [note, setNote] = React.useState('');

  const [quickCategories, setQuickCategories] = React.useState([]);

  React.useEffect(() => {
    let cancel = false;
    if (rootStore.account.data.length >= 0 && !props.transactionId) {
      setAccountId(rootStore.account.data[0].id);
    }

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
      }
      if (transaction.from) {
        setFrom(transaction.from.id);
      }
      if (transaction.to) {
        setTo(transaction.to.id);
      }
      if (transaction.category) {
        setCategoryName(transaction.category.name);
      }
      setAccountId(transaction.account.id);
      setDate(transaction.date);
      setStatus(transaction.status);
      setNote(transaction.note);
    };

    getTransaction();

    return () => {
      cancel = true;
    };
  }, []);

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
      if (!amount || !payeeName || !categoryName || !accountId || !date) {
        return false;
      }
    }
    if (type === TransactionType.Debit) {
      if (!amount || !categoryName || !accountId || !date) {
        return false;
      }
    }

    if (type === TransactionType.Transfer && from === to) {
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
        accountId,
        date,
        status,
        from,
        to,
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
      const payee = await repo(Payee).findOne({
        where: { name },
        relations: ['categories', 'accounts'],
      });
      if (notEmpty(payee)) {
        setQuickCategories(payee.categories.map((cate) => cate.name));
      }
    } catch (err) {
      logger.error(err);
    }
  }

  return (
    <div className='EditTransaction'>
      <InputField>
        <Radio selectedValue={type} onChange={setType}>
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
          <Select onChange={(value) => setFrom(Number(value))} value={from} label='From'>
            {rootStore.account.data.map((account: Account) => (
              <Select.Option key={account.id} value={account.id} label={account.name} />
            ))}
          </Select>
        </InputField>
      )}
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
          <Select onChange={(value) => setTo(Number(value))} value={to} label='To'>
            {rootStore.account.data.map((account: Account) => (
              <Select.Option key={account.id} value={account.id} label={account.name} />
            ))}
          </Select>
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
      {type !== TransactionType.Transfer && (
        <InputField>
          <Select
            onChange={(value: number) => {
              setAccountId(Number(value));
            }}
            value={accountId}>
            {rootStore.account.data.map((account: Account) => (
              <Select.Option key={account.id} value={account.id} label={account.name} />
            ))}
          </Select>
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

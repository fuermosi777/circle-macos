import { observer } from 'mobx-react';
import * as React from 'react';

import { IAccount } from '../interface/account';
import { CategoryType } from '../interface/category';
import {
  ITransaction,
  ITransactionInstance,
  TransactionStatus,
  TransactionType,
} from '../interface/transaction';
import { rootStore } from '../stores/root_store';
import { isEmpty } from '../utils/helper';
import { logger } from '../utils/logger';
import { addOrEditTransaction } from '../utils/operations';
import { Button } from './button';
import { Checkbox } from './checkbox';
import { DatePicker } from './date_picker';
import { Gap } from './gap';
import { Input } from './input';
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

  React.useEffect(() => {
    let cancel = false;
    if (rootStore.account.data.length >= 0 && !props.transactionId) {
      setAccountId(rootStore.account.data[0].id);
    }

    const getTransaction = async () => {
      if (cancel || isEmpty(props.transactionId)) {
        return;
      }
      const transaction = await rootStore.transaction.get({ id: props.transactionId });
      if (!transaction) {
        logger.warn(
          `Try to load a transaction for editing but did not find it: ${props.transactionId}`,
        );
        return;
      }
      // Found a transaction, load to states.
      if (transaction.payeeId) {
        const payee = await rootStore.payee.get({ id: transaction.payeeId });
        setType(transaction.type);
        setAmount(String(transaction.amount));
        if (payee) {
          setPayeeName(payee.name);
        }
      }
      if (transaction.from) {
        const fromTransaction = await rootStore.transaction.get({ id: transaction.from });
        if (fromTransaction) {
          setFrom(fromTransaction.id);
        }
      }
      if (transaction.to) {
        const toTransaction = await rootStore.transaction.get({ id: transaction.to });
        if (toTransaction) {
          setTo(toTransaction.id);
        }
      }
      const category = await rootStore.category.get({ id: transaction.categoryId });
      if (category) {
        setCategoryName(category.name);
      }
      setAccountId(transaction.accountId);
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
    if (type !== TransactionType.Transfer) {
      if (!amount || !payeeName || !categoryName || !accountId || !date) {
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

  return (
    <div className='EditTransaction'>
      <Radio selectedValue={type} onChange={setType}>
        <Radio.Option label='Expense' value={TransactionType.Credit} />
        <Radio.Option label='Income' value={TransactionType.Debit} />
        <Radio.Option label='Transfer' value={TransactionType.Transfer} />
      </Radio>
      <Gap size={15} />
      <Input placeholder='Amount' value={amount} onChange={handleAmountChange} />
      <Gap size={15} />
      {type === TransactionType.Transfer ? (
        <Select onChange={(value) => setFrom(Number(value))} value={from} label='From'>
          {rootStore.account.data.map((account: IAccount) => (
            <Select.Option key={account.id} value={account.id} label={account.name} />
          ))}
        </Select>
      ) : (
        <Input
          placeholder='Payee'
          value={payeeName}
          onChange={setPayeeName}
          options={rootStore.payee.data.map((pe) => pe.name)}
        />
      )}
      <Gap size={15} />
      {type === TransactionType.Transfer ? (
        <Select onChange={(value) => setTo(Number(value))} value={to} label='To'>
          {rootStore.account.data.map((account: IAccount) => (
            <Select.Option key={account.id} value={account.id} label={account.name} />
          ))}
        </Select>
      ) : (
        <Input
          placeholder='Cateogry'
          value={categoryName}
          onChange={setCategoryName}
          options={rootStore.category.data.map((cat) => cat.name)}
        />
      )}
      {type !== TransactionType.Transfer && (
        <>
          <Gap size={15} />
          <Select
            onChange={(value: number) => {
              setAccountId(Number(value));
            }}
            value={accountId}>
            {rootStore.account.data.map((account: IAccount) => (
              <Select.Option key={account.id} value={account.id} label={account.name} />
            ))}
          </Select>
        </>
      )}
      <Gap size={15} />
      <DatePicker value={date} onChange={setDate} />
      <Gap size={15} />
      <Checkbox
        isChecked={status === TransactionStatus.Cleared}
        label='Cleared'
        onChange={(isChecked) =>
          setStatus(isChecked ? TransactionStatus.Cleared : TransactionStatus.Pending)
        }
      />
      <Gap size={15} />
      <Input placeholder='Add some notes' value={note} onChange={setNote} />
      <div className='button-group'>
        <Button label='Cancel' onClick={props.onCancel} />
        <Gap vertical size={10} />
        <Button label='Done' onClick={handleDoneClick} disabled={!isDoneClickable()} />
      </div>
    </div>
  );
});

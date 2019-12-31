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
      logger.info(`Trying to create a new transaction`, {
        type,
        amount,
        from,
        to,
      });
      if (type === TransactionType.Transfer) {
        const creditTrans: ITransactionInstance = {
          type: TransactionType.Credit,
          amount: Number(amount),
          accountId: from,
          date,
          from,
          to,
          status,
          isDone: false,
          note,
        };
        const creditTransId = await rootStore.transaction.add(creditTrans);
        creditTrans.id = creditTransId;
        const debitTrans: ITransaction = {
          type: TransactionType.Debit,
          amount: Number(amount),
          accountId: to,
          date,
          from,
          to,
          status,
          isDone: false,
          note,
          siblingId: creditTransId,
        };
        const debitTransId = await rootStore.transaction.add(debitTrans);
        creditTrans.siblingId = debitTransId;
        await rootStore.transaction.put(creditTrans);
      } else {
        // For non-trasfer type, first create or get the category.
        let categoryId: number;
        const category = await rootStore.category.get({ name: categoryName });
        if (!category) {
          let categoryType;
          if (type === TransactionType.Credit) {
            categoryType = CategoryType.Expense;
          } else if (type === TransactionType.Debit) {
            categoryType = CategoryType.Income;
          } else {
            logger.warn(`Incorrect transaction type.`);
            return;
          }
          categoryId = await rootStore.category.add({
            name: categoryName,
            type: categoryType,
          });
        } else {
          categoryId = category.id;
        }

        let payee = await rootStore.payee.get({ name: payeeName });
        if (!payee) {
          const payeeId = await rootStore.payee.add({
            name: payeeName,
            categoryIds: [],
            accountIds: [],
          });
          payee = await rootStore.payee.get({ id: payeeId });
        }
        const categoryIdSet = new Set<number>(payee.categoryIds);
        const accountIdSet = new Set<number>(payee.accountIds);
        if (!categoryIdSet.has(categoryId)) {
          categoryIdSet.add(categoryId);
        }
        if (!accountIdSet.has(accountId)) {
          accountIdSet.add(accountId);
        }
        payee.categoryIds = Array.from(categoryIdSet);
        payee.accountIds = Array.from(accountIdSet);

        await rootStore.payee.put(payee);

        // Now create or update the transaction.
        let transaction: ITransaction;
        if (props.transactionId) {
          transaction = await rootStore.transaction.get({ id: props.transactionId });
          transaction.type = type;
          transaction.amount = Number(amount);
          transaction.accountId = accountId;
          transaction.date = date;
          transaction.payeeId = payee.id;
          transaction.categoryId = categoryId;
          transaction.status = status;
          transaction.note = note;
        } else {
          transaction = {
            type,
            amount: Number(amount),
            accountId,
            date,
            payeeId: payee.id,
            categoryId,

            status,
            isDone: false,
            note,
          };
        }
        await rootStore.transaction.put(transaction);
      }
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

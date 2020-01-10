import { getRepository as repo } from 'typeorm';

import { Account } from '../models/account';
import { Category, CategoryType } from '../models/category';
import { Payee } from '../models/payee';
import { Transaction, TransactionStatus, TransactionType } from '../models/transaction';
import { rootStore } from '../stores/root_store';
import { isEmpty, notEmpty } from './helper';
import { logger } from './logger';

/*
  1. add a transfer - add two transactions
  2. add a exp/income - add a transaction
  3. edit a transfer - delete the two and create two new
  4. edit a exp/income - delete and create new
  5. convert a exp/income to transfer - delete old and add two
  6. convert a transfer to exp/income - delete the two and create one
*/
export async function addOrEditTransaction(
  type: TransactionType,
  amount: number,
  // Must pass in a valid account ID.
  accountId: number,
  date: Date,
  status: TransactionStatus,
  from?: number,
  to?: number,
  categoryName?: string,
  payeeName?: string,
  isDone = false,
  note?: string,
  // If passing a transaction ID, then edit the existing one.
  transactionId?: number,
  load = true,
) {
  try {
    if (type === TransactionType.Transfer) {
      // For editing, delete the old two transactions.
      if (notEmpty(transactionId)) {
        const transaction = await repo(Transaction).findOne(transactionId, {
          relations: ['sibling'],
        });
        if (notEmpty(transaction) && notEmpty(transaction.sibling)) {
          await repo(Transaction).delete(transaction.sibling.id);
          await repo(Transaction).delete(transactionId);
        } else {
          throw new Error(
            `Try to delete Transfer transaction of ${transactionId} and \n
            ${transaction.sibling.id} but it doesn't exist.`,
          );
        }
      }

      let fromAccount: Account;
      if (notEmpty(from)) {
        fromAccount = await repo(Account).findOne(from);
      }
      let toAccount: Account;
      if (notEmpty(to)) {
        toAccount = await repo(Account).findOne(to);
      }

      // For transfer, create two corresbonding transactions.
      const creditTrans = new Transaction();

      creditTrans.type = TransactionType.Credit;
      creditTrans.amount = amount;
      creditTrans.account = fromAccount;
      creditTrans.date = date;
      creditTrans.from = fromAccount;
      creditTrans.to = toAccount;
      creditTrans.status = status;
      creditTrans.isDone = isDone;
      creditTrans.note = note;
      await repo(Transaction).save(creditTrans);

      const debitTrans = new Transaction();
      debitTrans.type = TransactionType.Debit;
      debitTrans.amount = amount;
      debitTrans.account = toAccount;
      debitTrans.date = date;
      debitTrans.from = fromAccount;
      debitTrans.to = toAccount;
      debitTrans.status = status;
      debitTrans.isDone = isDone;
      debitTrans.note = note;

      debitTrans.sibling = creditTrans;
      await repo(Transaction).save(debitTrans);

      creditTrans.sibling = debitTrans;
      await repo(Transaction).save(creditTrans);
    } else {
      // For non-trasfer type, first create or get the category.
      let category = await repo(Category).findOne({ name: categoryName });
      if (isEmpty(category)) {
        let categoryType;
        if (type === TransactionType.Credit) {
          categoryType = CategoryType.Expense;
        } else if (type === TransactionType.Debit) {
          categoryType = CategoryType.Income;
        } else {
          throw new Error(`Incorrect category type.`);
        }
        category = new Category();
        category.name = categoryName;
        category.type = categoryType;
        await repo(Category).save(category);
        logger.info(`Category ${categoryName} doesn't exist. Create one.`);
      }

      let payee = await repo(Payee).findOne({
        where: { name: payeeName },
        relations: ['categories', 'accounts'],
      });
      if (isEmpty(payee)) {
        payee = new Payee();
        payee.name = payeeName;
        payee.categories = [];
        payee.accounts = [];
        await repo(Payee).save(payee);

        logger.info(`Payee ${payeeName} doesn't exist. Create one.`);
      }

      const account = await repo(Account).findOne(accountId);
      if (isEmpty(account)) {
        throw new Error(`Account with ID ${accountId} doesn't exist.`);
      }

      if (isEmpty(payee.categories)) {
        payee.categories = [];
      }
      if (isEmpty(payee.accounts)) {
        payee.accounts = [];
      }
      payee.categories.push(category);
      payee.accounts.push(account);
      await repo(Payee).save(payee);

      // If has transaction ID, just delete the old one and create new.
      if (notEmpty(transactionId)) {
        await repo(Transaction).delete(transactionId);
      }

      const transaction = new Transaction();
      transaction.type = type;
      transaction.amount = amount;
      transaction.account = account;
      transaction.date = date;
      transaction.payee = payee;
      transaction.category = category;
      transaction.isDone = isDone;
      transaction.note = note;
      transaction.status = status;

      await repo(Transaction).save(transaction);
    }

    if (load) {
      if (transactionId) {
        await rootStore.transaction.reload();
      } else {
        await rootStore.transaction.freshLoad();
      }
      await rootStore.category.freshLoad();
      await rootStore.payee.freshLoad();
    }
  } catch (err) {
    throw err;
  }
}

export async function deleteTransaction(id: number) {
  try {
    const transaction = await repo(Transaction).findOne(id, {
      relations: ['sibling'],
    });
    if (isEmpty(transaction)) {
      logger.warn(`Transaction ${id} doesn't exist.`);
      return;
    }
    const transactionId = transaction.id;

    // For transfer transaction, remove the sibling first.
    if (notEmpty(transaction.sibling)) {
      const siblingId = transaction.sibling.id;
      const sibling = await repo(Transaction).findOne(siblingId);
      sibling.sibling = null;
      transaction.sibling = null;
      await repo(Transaction).save(sibling);
      await repo(Transaction).save(transaction);
      await repo(Transaction).delete(siblingId);
    }
    await repo(Transaction).delete(transactionId);
  } catch (err) {
    throw err;
  }
}

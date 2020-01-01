import { CategoryType } from '../interface/category';
import { IPayee } from '../interface/payee';
import {
  ITransaction,
  ITransactionInstance,
  TransactionStatus,
  TransactionType,
} from '../interface/transaction';
import { rootStore } from '../stores/root_store';
import { logger } from './logger';

function addCategoryToPayee(payee: IPayee, categoryId: number) {
  const categoryIdSet = new Set<number>(payee.categoryIds);
  if (!categoryIdSet.has(categoryId)) {
    categoryIdSet.add(categoryId);
  }

  payee.categoryIds = Array.from(categoryIdSet);
}

function addAccountToPayee(payee: IPayee, accountId: number) {
  const accountIdSet = new Set<number>(payee.accountIds);
  if (!accountIdSet.has(accountId)) {
    accountIdSet.add(accountId);
  }
  payee.accountIds = Array.from(accountIdSet);
}

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
) {
  try {
    if (type === TransactionType.Transfer) {
      // For transfer, create two corresbonding transactions.
      const creditTrans: ITransactionInstance = {
        type: TransactionType.Credit,
        amount,
        accountId: from,
        date,
        from,
        to,
        status,
        isDone,
        note,
      };
      const creditTransId = await rootStore.transaction.add(creditTrans);
      creditTrans.id = creditTransId;
      const debitTrans: ITransactionInstance = {
        type: TransactionType.Debit,
        amount,
        accountId: to,
        date,
        from,
        to,
        status,
        isDone,
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
          logger.warn(`Incorrect category type.`);
          return;
        }
        categoryId = await rootStore.category.add({
          name: categoryName,
          type: categoryType,
        });
        logger.info(`Category ${categoryName} doesn't exist. Create one.`);
      } else {
        categoryId = category.id;
      }

      let payee = await rootStore.payee.get({ name: payeeName });
      if (!payee) {
        payee = {
          name: payeeName,
          categoryIds: [],
          accountIds: [],
        };
        const payeeId = await rootStore.payee.add(payee);
        logger.info(`Payee ${payeeName} doesn't exist. Create one.`);
        payee.id = payeeId;
      }

      addCategoryToPayee(payee, categoryId);
      addAccountToPayee(payee, accountId);
      await rootStore.payee.put(payee);

      // If has transaction ID, just delete the old one and create new.
      if (transactionId) {
        await rootStore.transaction.delete(transactionId);
      }

      const transaction: ITransaction = {
        type,
        amount,
        accountId,
        date,
        payeeId: payee.id,
        categoryId,

        status,
        isDone,
        note,
      };

      await rootStore.transaction.put(transaction);
    }
  } catch (err) {
    throw err;
  }
}

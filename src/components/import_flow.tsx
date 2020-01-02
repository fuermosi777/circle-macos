import * as fs from 'fs';

import parse from 'csv-parse';
import { remote } from 'electron';
import moment from 'moment';
import * as React from 'react';

import db from '../database';
import { IAccount } from '../interface/account';
import { TransactionStatus, TransactionType } from '../interface/transaction';
import { rootStore } from '../stores/root_store';
import { isEmpty, notEmpty } from '../utils/helper';
import { logger } from '../utils/logger';
import { addOrEditTransaction } from '../utils/operations';
import { Button } from './button';
import { Gap } from './gap';

interface IProps {
  onCancel(): void;
}

export const ImportFlow = (props: IProps) => {
  const [messages, setMessages] = React.useState(['Waiting for open CSV file...']);

  function localLog(msg: string) {
    setMessages((oldMessages) => [...oldMessages, msg]);
  }

  function parseAsync(input: string): Promise<any> {
    return new Promise((resolve, reject) => {
      parse(input, (err, output) => {
        if (err) {
          reject(err);
        } else {
          resolve(output);
        }
      });
    });
  }
  async function handleOpenClick() {
    try {
      const openResult = await remote.dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
          {
            name: 'CSV file',
            extensions: ['csv'],
          },
        ],
        message: 'Open a CSV file to start import',
      });
      if (openResult.filePaths && openResult.filePaths.length > 0) {
        const filePath = openResult.filePaths[0];
        localLog(`Open file ${filePath}`);
        const context = fs.readFileSync(filePath, 'utf8');
        const parsed: any[] = await parseAsync(context);
        if (parsed.length <= 1) {
          throw new Error(
            `Not enough data from the CSV file: only get ${parsed.length} record(s).`,
          );
        }
        localLog(`Received ${parsed.length - 1} records.`);

        await db.transaction(
          'rw',
          db.transactions,
          db.accounts,
          db.categories,
          db.payees,
          async () => {
            localLog('Start importing records.');
            for (let i = 1; i < parsed.length; i++) {
              const [
                date,
                description,
                categoryName,
                payeeName,
                notes,
                pendingOrCleared,
                accountName,
                transferAccountName,
                amount,
              ] = parsed[i];
              const account = await db.accounts.get({ name: accountName });
              let transferAccount: IAccount;
              if (notEmpty(transferAccountName)) {
                transferAccount = await db.accounts.get({ name: transferAccountName });
              }
              // Doesn't find account with name or trasferAccountName, panic.
              if (!account || (notEmpty(transferAccountName) && isEmpty(transferAccount))) {
                throw new Error(
                  `Account with name "${accountName}" doesn't exist. Stop and undo everything. Please create the account and then try again.`,
                );
              }
              const numeral = Number(amount.replace(/\,/g, ''));
              const type: TransactionType =
                numeral < 0 ? TransactionType.Credit : TransactionType.Debit;
              const status: TransactionStatus =
                pendingOrCleared === 'Cleared'
                  ? TransactionStatus.Cleared
                  : TransactionStatus.Pending;
              let toAccount: IAccount;
              let fromAccount: IAccount;
              let toAccountId: number;
              let fromAccountId: number;
              if (notEmpty(transferAccountName)) {
                if (numeral < 0) {
                  toAccount = await db.accounts.get({ name: transferAccountName });
                  toAccountId = toAccount.id;
                  fromAccountId = account.id;
                } else if (numeral > 0) {
                  fromAccount = await db.accounts.get({ name: transferAccountName });
                  fromAccountId = fromAccount.id;
                  toAccountId = account.id;
                }
              }
              await addOrEditTransaction(
                type,
                Math.abs(numeral),
                account.id,
                moment(date).toDate(),
                status,
                fromAccountId,
                toAccountId,
                categoryName,
                payeeName,
                true,
                notes,
                undefined, // should sync
                false, // should sync
              );
              localLog(`Done ${i}/${parsed.length - 1}.`);
            }
          },
        );

        // Sync after bulk import.
        await rootStore.transaction.sync();
        await rootStore.category.sync();
        await rootStore.payee.sync();
        await rootStore.account.sync();
      } else {
        localLog(`Do not open any file.`);
      }
    } catch (err) {
      localLog(`Error: ${err.message}`);
      logger.error(err);
    }
  }
  return (
    <div className='ImportFlow'>
      <div className='helper-text'>Open a CSV file to start the import process.</div>
      <div className='button-group'>
        <Button label='Open' onClick={handleOpenClick} />
        <Gap vertical size={10} />
        <Button label='Close' onClick={props.onCancel} />
      </div>
      <div className='message-box'>
        {messages.map((msg, index) => (
          <p key={index}>{msg}</p>
        ))}
      </div>
    </div>
  );
};

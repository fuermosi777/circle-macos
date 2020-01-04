import assert from 'assert';
import * as fs from 'fs';

import parse from 'csv-parse';
import { remote } from 'electron';
import moment from 'moment';
import * as React from 'react';
import { getConnection } from 'typeorm';

import { Account } from '../models/account';
import { TransactionStatus, TransactionType } from '../models/transaction';
import { rootStore } from '../stores/root_store';
import { isEmpty, notEmpty } from '../utils/helper';
import { logger } from '../utils/logger';
import { addOrEditTransaction } from '../utils/operations';
import { Button } from './button';
import { Gap } from './gap';

interface IProps {
  onCancel(): void;
}

function validateLine(line: string[], lineIndex: number) {
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
  ] = line;
  assert(
    line.length === 9,
    `Incorrect file format. Only support exported CSV from Debit & Credit app. Please be sure to include at least one "pending" transaction or this field will be missing from the exported file.`,
  );
  assert(notEmpty(date), `Missing date at ${lineIndex}.`);
  assert(notEmpty(accountName), `Missing account name at ${lineIndex}.`);
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

        await getConnection().transaction(async (manager) => {
          localLog('Start importing records.');
          let foundTransfer = false;
          let transferFromAccount: Account;
          let transferToAccount: Account;
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
            validateLine(parsed[i], i);
            const account = await manager.findOne(Account, { name: accountName });
            let transferAccount: Account;
            if (notEmpty(transferAccountName)) {
              transferAccount = await manager.findOne(Account, { name: transferAccountName });
            }
            // Doesn't find account with name or trasferAccountName, panic.
            if (!account || (notEmpty(transferAccountName) && isEmpty(transferAccount))) {
              throw new Error(
                `Account with name "${accountName}" or "${transferAccountName}" doesn't exist. Stop and undo everything. Please check and create the account and then try again.`,
              );
            }
            const numeral = Number(amount.replace(/\,/g, ''));
            let type: TransactionType =
              numeral < 0 ? TransactionType.Credit : TransactionType.Debit;
            const status: TransactionStatus =
              pendingOrCleared === 'Cleared'
                ? TransactionStatus.Cleared
                : TransactionStatus.Pending;

            // Handler transfers.
            if (notEmpty(transferAccountName)) {
              type = TransactionType.Transfer;
              if (numeral < 0) {
                transferToAccount = await manager.findOne(Account, { name: transferAccountName });
              } else if (numeral > 0) {
                transferFromAccount = await manager.findOne(Account, { name: transferAccountName });
              }
              if (!foundTransfer) {
                foundTransfer = true;
              } else if (foundTransfer) {
                foundTransfer = false;
              }
            }

            if (!foundTransfer) {
              // TODO: use entity manager.
              await addOrEditTransaction(
                type,
                Math.abs(numeral),
                account.id,
                moment(date).toDate(),
                status,
                transferFromAccount ? transferFromAccount.id : undefined,
                transferToAccount ? transferToAccount.id : undefined,
                categoryName,
                payeeName,
                true,
                notes || description,
                undefined, // should sync
                false, // should sync
              );
            }
            localLog(`Done ${i}/${parsed.length - 1}.`);
          }
        });

        // Sync after bulk import.
        await rootStore.transaction.freshLoad();
        await rootStore.category.freshLoad();
        await rootStore.payee.freshLoad();
        await rootStore.account.freshLoad();
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

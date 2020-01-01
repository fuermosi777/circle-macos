import * as fs from 'fs';

import parse from 'csv-parse';
import { remote } from 'electron';
import * as React from 'react';

import db from '../database';
import { logger } from '../utils/logger';
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

        await db.transaction('rw', db.transactions, db.accounts, async () => {
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
            if (!account) {
              throw new Error(
                `Account with name "${accountName}" doesn't exist. Stop and undo everything. Please create the account and then try again.`,
              );
            }
          }
        });
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
        <Button label='Cancel' onClick={props.onCancel} />
      </div>
      <div className='message-box'>
        {messages.map((msg, index) => (
          <p key={index}>{msg}</p>
        ))}
      </div>
    </div>
  );
};

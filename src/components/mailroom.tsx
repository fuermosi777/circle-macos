import { ipcRenderer } from 'electron';
import * as React from 'react';
import { getRepository as repo } from 'typeorm';

import { Message } from '../interface/message';
import { Transaction, TransactionStatus } from '../models/transaction';
import { rootStore } from '../stores/root_store';
import { logger } from '../utils/logger';
import { EditAccount } from './edit_account';
import { EditTransaction } from './edit_transaction';
import { ImportFlow } from './import_flow';
import { Preferences } from './preferences';

export const Mailroom = (): null => {
  ipcRenderer.on(Message.RequestImport.toString(), () => {
    rootStore.modal.openModal(<ImportFlow onCancel={() => rootStore.modal.closeModal()} />);
  });

  ipcRenderer.on(Message.RequestNewAccount.toString(), () => {
    rootStore.modal.openModal(<EditAccount onCancel={() => rootStore.modal.closeModal()} />);
  });

  ipcRenderer.on(Message.RequestNewTransaction.toString(), () => {
    rootStore.modal.openModal(<EditTransaction onCancel={() => rootStore.modal.closeModal()} />);
  });

  ipcRenderer.on(Message.RequestViewPreferences.toString(), () => {
    rootStore.modal.openModal(<Preferences onCancel={() => rootStore.modal.closeModal()} />);
  });

  ipcRenderer.on(Message.RequestMarkCleared.toString(), async () => {
    try {
      let id = rootStore.transaction.selectedTransactionId;
      if (!id) return;
      const transaction = await repo(Transaction).findOne(id);
      if (!transaction) {
        throw new Error(`Transaction doesn't exist.`);
      }
      transaction.status = TransactionStatus.Cleared;
      await repo(Transaction).save(transaction);
    } catch (err) {
      logger.error(`Failed to mark transaction clearer: `, err);
    }
  });

  ipcRenderer.on(Message.RequestMarkPending.toString(), () => {
    let id = rootStore.transaction.selectedTransactionId;
    if (!id) return;
  });

  return null;
};

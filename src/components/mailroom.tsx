import { ipcRenderer } from 'electron';
import * as React from 'react';

import { Message } from '../interface/message';
import { rootStore } from '../stores/root_store';
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

  return null;
};

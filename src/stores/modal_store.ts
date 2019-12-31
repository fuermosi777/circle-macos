import { action, decorate, observable } from 'mobx';

import { RootStore } from './root_store';

export class ModalStore {
  showModal: boolean = false;
  modalContent: JSX.Element;

  constructor(public rootStore: RootStore) {}

  openModal(content?: JSX.Element): void {
    if (this.showModal) {
      return;
    }
    this.modalContent = content;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.modalContent = null;
  }
}

decorate(ModalStore, {
  showModal: observable,
  openModal: action,
  closeModal: action,
});

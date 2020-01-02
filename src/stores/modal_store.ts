import { action, observable } from 'mobx';

import { RootStore } from './root_store';

export class ModalStore {
  @observable
  showModal: boolean;

  @observable.ref
  modalContent: JSX.Element;

  constructor(public rootStore: RootStore) {}

  @action
  openModal(content?: JSX.Element): void {
    if (this.showModal) {
      return;
    }
    this.modalContent = content;
    this.showModal = true;
  }

  @action
  closeModal(): void {
    this.showModal = false;
    this.modalContent = null;
  }
}

import { configure } from 'mobx';

import { AccountStore } from './account_store';
import { AppStore } from './app_store';
import { CategoryStore } from './category_store';
import { ModalStore } from './modal_store';
import { PayeeStore } from './payee_store';
import { ProfileStore } from './profile_store';
import { TransactionStore } from './transaction_store';

// configure({ enforceActions: 'strict' });

class RootStore {
  modal: ModalStore;
  account: AccountStore;
  app: AppStore;
  payee: PayeeStore;
  category: CategoryStore;
  transaction: TransactionStore;
  profile: ProfileStore;

  constructor() {
    this.modal = new ModalStore(this);
    this.account = new AccountStore(this);
    this.app = new AppStore(this);
    this.payee = new PayeeStore(this);
    this.category = new CategoryStore(this);
    this.transaction = new TransactionStore(this);
    this.profile = new ProfileStore(this);
  }
}

const rootStore = new RootStore();

export { RootStore, rootStore };

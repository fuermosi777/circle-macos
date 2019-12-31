import { IPayee } from '../interface/payee';
import { BaseDbStore } from './base_db_store';
import { RootStore } from './root_store';

export class PayeeStore extends BaseDbStore<IPayee> {
  constructor(public rootStore: RootStore) {
    super('payees');
  }
}

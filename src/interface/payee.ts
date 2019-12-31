export interface IPayee {
  id?: number;
  name: string;
  // One payee might belong to many categories.
  // We use this field to give a hint to the user which category they should select for a transaction.
  categoryIds: number[];
  // Used account to this payee.
  accountIds: number[];
}

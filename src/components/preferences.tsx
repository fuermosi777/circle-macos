import { observer } from 'mobx-react';
import * as React from 'react';

import { Currency, CurrencyLabel } from '../interface/currency';
import { rootStore } from '../stores/root_store';
import { Button } from './button';
import { Checkbox } from './checkbox';
import { InputField } from './input_field';
import { Select } from './select';

interface IProps {
  onCancel(): void;
}

export const Preferences = observer((props: IProps) => {
  return (
    <div className='Preferences'>
      <InputField>
        <Checkbox
          label='Show balances on the side bar'
          isChecked={rootStore.profile.profile.showBalanceOnSide}
          onChange={(checked) => {
            rootStore.profile.set('showBalanceOnSide', checked);
          }}
        />
      </InputField>
      <InputField title='Primary currency'>
        <Select
          onChange={(value: Currency) => rootStore.profile.set('mainCurrency', value)}
          value={rootStore.profile.profile.mainCurrency}>
          {Object.keys(Currency).map((curr: keyof typeof Currency) => (
            <Select.Option key={curr} value={curr} label={CurrencyLabel[curr]} />
          ))}
        </Select>
      </InputField>
      <div className='button-group'>
        <Button label='Close' onClick={props.onCancel} />
      </div>
    </div>
  );
});

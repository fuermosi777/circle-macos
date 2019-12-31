import * as React from 'react';

interface IProps {
  isChecked: boolean;
  onChange(checked: boolean): void;
  label: string;
}

export const Checkbox = (props: IProps) => {
  return (
    <div className='Checkbox'>
      <input
        type='checkbox'
        checked={props.isChecked}
        onChange={(event) => props.onChange(event.target.checked)}
      />
      <span className='label'>{props.label}</span>
    </div>
  );
};

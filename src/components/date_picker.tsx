import moment from 'moment';
import * as React from 'react';

interface IProps {
  value: Date;
  onChange(date: Date): void;
}

export const DatePicker = (props: IProps) => {
  return (
    <input
      className='DatePicker'
      type='date'
      value={moment(props.value).format('YYYY-MM-DD')}
      onChange={(event) => props.onChange(moment(event.target.value).toDate())}
    />
  );
};

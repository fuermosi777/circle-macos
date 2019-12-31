import * as React from 'react';
import * as Icon from 'react-feather';

interface IProps {
  label?: string;
  value: any;
  onChange(value: any): void;
}

const Select: React.FunctionComponent<IProps> = (props) => {
  return (
    <div className='Select'>
      {props.label && <span className='label'>{props.label}</span>}
      <select onChange={(event) => props.onChange(event.target.value)} value={props.value}>
        {props.children}
      </select>
      <Icon.ChevronDown />
    </div>
  );
};

interface IOptionProps {
  value: string | number;
  label: string;
}

const Option = (props: IOptionProps) => {
  return <option value={props.value}>{props.label}</option>;
};

const Merged = Object.assign(Select, { Option });

export { Merged as Select };

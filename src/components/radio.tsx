import * as React from 'react';

interface IProps {
  selectedValue: any;
  onChange(value: any): void;
}

const Radio: React.FunctionComponent<IProps> = (props) => {
  function handleOptionClick(value: any) {
    props.onChange(value);
  }
  const childrenWithProps = React.Children.map(props.children, (child: React.ReactElement<any>) =>
    React.cloneElement(child, {
      onClick: handleOptionClick,
      selected: props.selectedValue === child.props.value,
    }),
  );
  return <div className='Radio'>{childrenWithProps}</div>;
};

interface IOptionProps {
  value: any;
  label: string;

  // Private used by Radio.
  selected?: boolean;
  onClick?(value: any): void;
}

const Option = (props: IOptionProps) => {
  return (
    <div
      className={`Option ${props.selected ? 'selected' : ''}`}
      onClick={() => props.onClick(props.value)}>
      {props.label}
    </div>
  );
};

const Merged = Object.assign(Radio, { Option });

export { Merged as Radio };

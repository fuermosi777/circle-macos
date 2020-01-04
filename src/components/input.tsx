import { Set } from 'immutable';
import * as React from 'react';

interface IProps {
  placeholder?: string;
  value: string;
  options?: string[];
  quickOptions?: string[];
  onChange(text: string): void;
}

interface IOptionLabelProps {
  label: string;
  onClick(label: string): void;
}

const OptionLabel = (props: IOptionLabelProps) => {
  return (
    <div className='option-label' onClick={() => props.onClick(props.label)}>
      {props.label}
    </div>
  );
};

export const Input: React.FunctionComponent<IProps> = (props) => {
  const [showOptions, setShowOptions] = React.useState(false);
  const quickOptionMap = Set<string>(props.quickOptions || []);

  // Starting with value, and also exlude anything from quick options.
  function getFilteredOptions(): string[] {
    const options = props.options.filter(
      (opt) => opt.toLowerCase().startsWith(props.value.toLowerCase()) && !quickOptionMap.has(opt),
    );
    return options;
  }

  function handleInputBlur() {
    setTimeout(() => {
      if (setShowOptions && showOptions) {
        setShowOptions(false);
      }
    }, 200);
  }

  function handleOptionClick(option: string) {
    props.onChange(option);
    setShowOptions(false);
  }

  function hasQuickOptions() {
    return props.quickOptions && props.quickOptions.length > 0;
  }

  return (
    <div className='Input'>
      <input
        type='text'
        placeholder={props.placeholder || ''}
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
        onFocus={() => setShowOptions(true)}
        onBlur={handleInputBlur}
      />
      {showOptions && props.options && props.options.length > 0 && (
        <div className='options'>
          {hasQuickOptions() && (
            <div className='option-group'>
              {props.quickOptions.map((opt) => (
                <OptionLabel key={opt} label={opt} onClick={handleOptionClick} />
              ))}
            </div>
          )}
          {hasQuickOptions() && <div className='option-divider'></div>}
          <div className='options-group'>
            {getFilteredOptions().map((opt) => (
              <OptionLabel key={opt} label={opt} onClick={handleOptionClick} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

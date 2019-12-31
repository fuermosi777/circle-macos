import * as React from 'react';

interface IProps {
  placeholder?: string;
  value: string;
  options?: string[];
  onChange(text: string): void;
}

export const Input: React.FunctionComponent<IProps> = (props) => {
  const [showOptions, setShowOptions] = React.useState(false);

  function getFilteredOptions(): string[] {
    const options = props.options.filter((opt) =>
      opt.toLowerCase().startsWith(props.value.toLowerCase()),
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
          {getFilteredOptions().map((opt: string) => (
            <div key={opt} className='option-label' onClick={() => handleOptionClick(opt)}>
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from "react";
import { Input } from "antd";
import type { InputProps } from "antd";

interface DebouncedSearchInputProps extends Omit<InputProps, "onChange" | "value"> {
  value: string;
  onChange: (value: string) => void;
  debounceTimeout?: number;
}

const DebouncedSearchInput: React.FC<DebouncedSearchInputProps> = ({
  value,
  onChange,
  debounceTimeout = 500,
  ...props
}) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    const handler = setTimeout(() => {
      onChange(localValue);
    }, debounceTimeout);

    return () => {
      clearTimeout(handler);
    };
  }, [localValue, onChange, debounceTimeout]);

  return (
    <Input
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      {...props}
    />
  );
};

export default DebouncedSearchInput;

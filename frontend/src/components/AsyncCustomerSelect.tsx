import { useQuery } from '@tanstack/react-query';
import Select from 'react-select';
import api from '../lib/api';
import type { Customer } from '../types';

interface CustomerOption {
  value: number;
  label: string;
}

interface Props {
  value?: number | null;
  onChange: (value: number | null) => void;
  disabled?: boolean;
  error?: string;
  placeholder?: string;
}

export default function AsyncCustomerSelect({
  value,
  onChange,
  disabled,
  error,
  placeholder = 'Buscar cliente...',
}: Props) {
  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data } = await api.get('/customers?limit=5000');
      return data.data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const options: CustomerOption[] = customers.map((c) => ({
    value: c.id,
    label: c.companyName ? `${c.companyName} - ${c.contactName}` : c.contactName,
  }));

  const currentValue = options.find((opt) => opt.value === value) ?? null;

  return (
    <div>
      <Select
        value={currentValue}
        onChange={(option) => onChange(option?.value ?? null)}
        options={options}
        isDisabled={disabled}
        placeholder={placeholder}
        isClearable
        isSearchable
        noOptionsMessage={() => 'Sin resultados'}
        classNamePrefix="react-select"
        styles={{
          container: (base) => ({ ...base, width: '100%' }),
          control: (base, state) => ({
            ...base,
            borderColor: error ? '#ef4444' : state.isFocused ? '#2563eb' : '#d1d5db',
            boxShadow: 'none',
            '&:hover': {
              borderColor: error ? '#ef4444' : '#2563eb',
            },
            minHeight: '38px',
          }),
          menu: (base) => ({ ...base, zIndex: 50 }),
        }}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}

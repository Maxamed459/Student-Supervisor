import { useState } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';

export default function Input({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  name,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm text-gray-600 mb-1.5" htmlFor={name}>
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={name}
          name={name}
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={`w-full h-11 px-3.5 rounded-lg border text-sm outline-none transition-colors
            ${error ? 'border-red-500' : 'border-gray-300 focus:border-secondary'}
            focus:ring-2 focus:ring-secondary/20`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
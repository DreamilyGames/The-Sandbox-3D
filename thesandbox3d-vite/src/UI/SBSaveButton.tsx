import type { ButtonHTMLAttributes } from 'react';
import { Save } from 'lucide-react';
import { GetTailwindColor } from './SBTailwindCSSReader';

interface SBSaveButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  label?: string;
}

export function SBSaveButton({
  label = 'Save',
  className = '',
  type = 'button',
  title,
  'aria-label': ariaLabel,
  ...props
}: SBSaveButtonProps) {
  return (
    <button
      {...props}
      type={type}
      aria-label={ariaLabel ?? label}
      title={title ?? label}
      className={`inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-sky-400/30 bg-sky-600 text-white transition-colors hover:bg-sky-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      <Save size={18} aria-hidden="true" 
      color={GetTailwindColor(`--color-default-white`)
      }/>
    </button>
  );
}

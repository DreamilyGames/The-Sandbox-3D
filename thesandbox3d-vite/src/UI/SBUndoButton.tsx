import { Undo } from "lucide-react";
import type { ButtonHTMLAttributes, ChangeEvent } from "react";
import { GetTailwindColor } from "./SBTailwindCSSReader";

interface SBUndoButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 
'children' | 'onClick'> {
  onClick: () => void;
}

export function SBUndoButton({
  className = '',
  disabled = false,
  ...buttonProps
}: SBUndoButtonProps) 
{

  return (
    <div className="flex items-center gap-2">
      <button
        {...buttonProps}
        type="button"
        aria-label={'Undo action'}
        title={'Undo action'}
        className={`inline-flex size-10 shrink-0 items-center justify-center rounded-full 
            border border-sky-400/30 bg-sky-600 text-white transition-colors hover:bg-sky-500 
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 
            disabled:cursor-not-allowed disabled:opacity-50 ${className}`}>
                
        <Undo size={18} aria-hidden="true" 
                color={GetTailwindColor(`--color-default-white`)}>

        </Undo>
      </button>
    </div>
  );
}
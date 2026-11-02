import React, { useCallback, useEffect } from 'react';

export enum EMessageBoxSeverity
{
  Warning,
  Error
}

interface SBMessageBoxProps {
  isOpen: boolean;
  title: string;
  msg: string;
  severity: EMessageBoxSeverity;
  onClose: () => void;
  onConfirm: () => void;
}

export function SBMessageBox({
  isOpen,
  title,
  msg,
  severity,
  onClose,
  onConfirm,
}: SBMessageBoxProps) {

    const closeHandler = useCallback(()=>
    {
        onClose()
    }, [onClose])

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeHandler();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeHandler]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div
        onClick={closeHandler}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6 space-y-5 text-slate-200 z-10 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header / Warning Icon */}
        <div className="flex items-start space-x-4">
          <div className=
          {`flex-shrink-0 w-10 h-10 rounded-full 
            ${severity === EMessageBoxSeverity.Error ? 
              "bg-red-500/10 border-red-500/20 text-red-400" :
              "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
            } 
            border  flex items-center justify-center`}>
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-slate-100 tracking-wide">
              {title}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {msg}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={closeHandler}
            className="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={() => {
              onConfirm();
              closeHandler();
            }}
            className="px-4 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-500 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            Yes
          </button>
        </div>

      </div>
    </div>
  );
}
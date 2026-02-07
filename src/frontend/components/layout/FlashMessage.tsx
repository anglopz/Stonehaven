/**
 * Flash Message Component
 */

'use client';

import { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useUiStore } from '@/stores';
import { FlashMessage as FlashMessageType } from '@/types';

export function FlashMessages() {
  const { flashMessages, removeFlashMessage } = useUiStore();

  useEffect(() => {
    if (flashMessages.length > 0) {
      const timer = setTimeout(() => {
        removeFlashMessage(0);
      }, 5000);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [flashMessages, removeFlashMessage]);

  if (flashMessages.length === 0) return null;

  return (
    <div className="fixed right-4 top-20 z-50 space-y-2">
      {flashMessages.map((message, index) => (
        <FlashMessage
          key={index}
          message={message}
          onClose={() => removeFlashMessage(index)}
        />
      ))}
    </div>
  );
}

interface FlashMessageProps {
  message: FlashMessageType;
  onClose: () => void;
}

function FlashMessage({ message, onClose }: FlashMessageProps) {
  const config = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-500',
      textColor: 'text-green-800',
      iconColor: 'text-green-500',
    },
    error: {
      icon: AlertCircle,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-500',
      textColor: 'text-red-800',
      iconColor: 'text-red-500',
    },
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-500',
      textColor: 'text-yellow-800',
      iconColor: 'text-yellow-500',
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-500',
      textColor: 'text-blue-800',
      iconColor: 'text-blue-500',
    },
  };

  const { icon: Icon, bgColor, borderColor, textColor, iconColor } =
    config[message.type];

  return (
    <div
      className={`flex w-96 items-start space-x-3 rounded-lg border-l-4 ${borderColor} ${bgColor} p-4 shadow-lg`}
    >
      <Icon className={`h-5 w-5 flex-shrink-0 ${iconColor}`} />
      <p className={`flex-1 text-sm font-medium ${textColor}`}>{message.message}</p>
      <button
        onClick={onClose}
        className={`flex-shrink-0 rounded-md transition-colors hover:bg-white/50 ${textColor}`}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

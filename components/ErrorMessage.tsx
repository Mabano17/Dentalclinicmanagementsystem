"use client";

import { FiAlertCircle, FiRefreshCw } from "react-icons/fi";

interface ErrorMessageProps {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorMessage({
  message = "Something went wrong. Please try again.",
  onRetry,
}: ErrorMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
        <FiAlertCircle className="w-7 h-7 text-red-500" />
      </div>
      <div className="text-center">
        <p className="text-gray-700 font-medium">Error</p>
        <p className="text-sm text-gray-500 mt-1 max-w-xs">{message}</p>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="btn-outline flex items-center gap-2">
          <FiRefreshCw className="w-4 h-4" />
          Retry
        </button>
      )}
    </div>
  );
}

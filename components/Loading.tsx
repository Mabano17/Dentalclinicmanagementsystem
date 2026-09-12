"use client";

interface LoadingProps {
  fullScreen?: boolean;
  message?: string;
  size?: "sm" | "md" | "lg";
}

export default function Loading({
  fullScreen = false,
  message = "Loading…",
  size = "md",
}: LoadingProps) {
  const spinnerSize = { sm: "w-6 h-6", md: "w-10 h-10", lg: "w-14 h-14" }[size];

  const inner = (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`${spinnerSize} border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin`}
      />
      {message && <p className="text-sm text-gray-500">{message}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        {inner}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-16">{inner}</div>
  );
}

export function LoadingRow({ cols }: { cols: number }) {
  return (
    <>
      {[...Array(5)].map((_, i) => (
        <tr key={i} className="animate-pulse">
          {[...Array(cols)].map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-4 bg-gray-200 rounded" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

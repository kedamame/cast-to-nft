"use client";

type Props = {
  type: "error" | "success" | "warning" | "info";
  message: string;
  onDismiss?: () => void;
};

const styles: Record<Props["type"], string> = {
  error: "bg-red-900/50 border-red-500 text-red-200",
  success: "bg-green-900/50 border-green-500 text-green-200",
  warning: "bg-yellow-900/50 border-yellow-500 text-yellow-200",
  info: "bg-blue-900/50 border-blue-500 text-blue-200",
};

export function StatusBanner({ type, message, onDismiss }: Props) {
  return (
    <div className={`border rounded-lg p-4 mb-4 flex items-center justify-between ${styles[type]}`}>
      <p>{message}</p>
      {onDismiss && (
        <button onClick={onDismiss} className="ml-4 hover:opacity-70">
          ✕
        </button>
      )}
    </div>
  );
}

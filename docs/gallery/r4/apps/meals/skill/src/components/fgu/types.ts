export interface MenuItem { label: string; value: string; disabled?: boolean }
export interface TabItem { id: string; label: string }
export interface ToastItem { id: number; message: string; actionLabel?: string; variant?: "info" | "error"; timeout?: number }

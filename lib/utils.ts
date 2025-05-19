import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper function to truncate text
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + "..."
}

// Helper function to count words in text
export function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length
}

// Helper function to count lines in text
export function countLines(text: string): number {
  return text.split("\n").length
}

// Helper function to format date
export function formatDate(date: Date | number): string {
  if (typeof date === "number") {
    date = new Date(date)
  }
  return date.toLocaleDateString()
}

// Helper function to format time
export function formatTime(date: Date | number): string {
  if (typeof date === "number") {
    date = new Date(date)
  }
  return date.toLocaleTimeString()
}

// Helper function to format date and time
export function formatDateTime(date: Date | number): string {
  if (typeof date === "number") {
    date = new Date(date)
  }
  return `${formatDate(date)} ${formatTime(date)}`
}

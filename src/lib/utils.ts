import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts a 24-hour time string (HH:mm) to a 12-hour time string (h:mm AM/PM).
 * @param timeString The time string in HH:mm format.
 * @returns The formatted 12-hour time string.
 */
export function formatTime(timeString: string): string {
  if (!timeString || !/^\d{2}:\d{2}$/.test(timeString)) {
    return "Invalid Time"; // Return a fallback for invalid format
  }

  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours, 10);
  
  const ampm = hour >= 12 ? 'PM' : 'AM';
  let hour12 = hour % 12;
  if (hour12 === 0) {
    hour12 = 12; // Handle midnight and noon
  }

  return `${hour12}:${minutes} ${ampm}`;
}

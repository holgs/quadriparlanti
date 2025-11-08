/**
 * Utility Functions
 * Core helper functions used throughout the application
 */

import crypto from 'crypto';

export { cn } from './cn';

/**
 * Hashes an IP address for privacy-compliant analytics
 * Uses SHA-256 with a daily salt from the config table
 *
 * @param ipAddress - IP address to hash
 * @param salt - Daily salt from database config
 * @returns Hashed IP address (hex string)
 */
export function hashIP(ipAddress: string, salt: string): string {
  const hash = crypto.createHash('sha256');
  hash.update(ipAddress + salt);
  return hash.digest('hex');
}

/**
 * Generates a random 6-character alphanumeric short code
 * Used for QR code generation
 *
 * @returns 6-character short code
 */
export function generateShortCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generates a slug from a string (kebab-case)
 *
 * @param text - Text to convert to slug
 * @returns Slugified string
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Detects device type from user agent string
 *
 * @param userAgent - User agent string from request
 * @returns Device type classification
 */
export function detectDeviceType(userAgent: string | null): 'mobile' | 'tablet' | 'desktop' | 'unknown' {
  if (!userAgent) return 'unknown';

  const ua = userAgent.toLowerCase();

  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile|wpdesktop/.test(ua)) {
    return 'mobile';
  }
  if (/bot|crawler|spider|crawling/i.test(ua)) {
    return 'unknown';
  }
  return 'desktop';
}

/**
 * Formats a file size in bytes to human-readable format
 *
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Validates school year format (YYYY-YY)
 *
 * @param schoolYear - School year string to validate
 * @returns True if valid format
 */
export function isValidSchoolYear(schoolYear: string): boolean {
  const regex = /^\d{4}-\d{2}$/;
  if (!regex.test(schoolYear)) return false;

  const [startYear, endYear] = schoolYear.split('-').map(Number);
  return startYear > 2000 && startYear < 2100 && endYear === (startYear + 1) % 100;
}

/**
 * Gets current school year in YYYY-YY format
 * School year starts in September
 *
 * @returns Current school year string
 */
export function getCurrentSchoolYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // JavaScript months are 0-indexed

  // If before September, we're still in the previous school year
  const startYear = month >= 9 ? year : year - 1;
  const endYear = startYear + 1;

  return `${startYear}-${String(endYear).slice(-2)}`;
}

/**
 * Extracts video ID from YouTube URL
 *
 * @param url - YouTube URL
 * @returns Video ID or null if invalid
 */
export function extractYouTubeID(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1];
  }

  return null;
}

/**
 * Extracts video ID from Vimeo URL
 *
 * @param url - Vimeo URL
 * @returns Video ID or null if invalid
 */
export function extractVimeoID(url: string): string | null {
  const pattern = /vimeo\.com\/(\d+)/;
  const match = url.match(pattern);
  return match ? match[1] : null;
}

/**
 * Extracts file ID from Google Drive URL
 *
 * @param url - Google Drive URL
 * @returns File ID or null if invalid
 */
export function extractDriveID(url: string): string | null {
  const patterns = [
    /drive\.google\.com\/file\/d\/([^/]+)/,
    /drive\.google\.com\/open\?id=([^&]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1];
  }

  return null;
}

/**
 * Validates and detects link type from URL
 *
 * @param url - URL to check
 * @returns Link type classification
 */
export function detectLinkType(url: string): 'youtube' | 'vimeo' | 'drive' | 'other' {
  const lowerUrl = url.toLowerCase();

  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
    return 'youtube';
  }
  if (lowerUrl.includes('vimeo.com')) {
    return 'vimeo';
  }
  if (lowerUrl.includes('drive.google.com')) {
    return 'drive';
  }

  return 'other';
}

/**
 * Truncates text to a specified length with ellipsis
 *
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

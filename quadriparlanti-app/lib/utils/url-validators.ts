/**
 * URL Validators for External Links
 * Supports YouTube, Vimeo, and Google Drive
 */

export type PlatformType = 'youtube' | 'vimeo' | 'google_drive' | 'other';

export interface ValidationResult {
  isValid: boolean;
  platform?: PlatformType;
  videoId?: string;
  embedUrl?: string;
  error?: string;
}

/**
 * Extract YouTube video ID from various URL formats
 */
export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

/**
 * Extract Vimeo video ID from URL
 */
export function extractVimeoId(url: string): string | null {
  const pattern = /vimeo\.com\/(?:video\/)?(\d+)/;
  const match = url.match(pattern);
  return match ? match[1] : null;
}

/**
 * Extract Google Drive file ID from URL
 */
export function extractGoogleDriveId(url: string): string | null {
  const patterns = [
    /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

/**
 * Validate and parse URL for supported platforms
 */
export function validateUrl(url: string): ValidationResult {
  // Clean URL
  const cleanUrl = url.trim();

  if (!cleanUrl) {
    return {
      isValid: false,
      error: 'URL is required',
    };
  }

  // Check if it's a valid URL
  try {
    new URL(cleanUrl);
  } catch {
    return {
      isValid: false,
      error: 'Invalid URL format',
    };
  }

  // Check YouTube
  const youtubeId = extractYouTubeId(cleanUrl);
  if (youtubeId) {
    return {
      isValid: true,
      platform: 'youtube',
      videoId: youtubeId,
      embedUrl: `https://www.youtube.com/embed/${youtubeId}`,
    };
  }

  // Check Vimeo
  const vimeoId = extractVimeoId(cleanUrl);
  if (vimeoId) {
    return {
      isValid: true,
      platform: 'vimeo',
      videoId: vimeoId,
      embedUrl: `https://player.vimeo.com/video/${vimeoId}`,
    };
  }

  // Check Google Drive
  const driveId = extractGoogleDriveId(cleanUrl);
  if (driveId) {
    return {
      isValid: true,
      platform: 'google_drive',
      videoId: driveId,
      embedUrl: `https://drive.google.com/file/d/${driveId}/preview`,
    };
  }

  // Other valid URL
  return {
    isValid: true,
    platform: 'other',
    embedUrl: cleanUrl,
  };
}

/**
 * Get platform icon name
 */
export function getPlatformIcon(platform: PlatformType): string {
  switch (platform) {
    case 'youtube':
      return 'Youtube';
    case 'vimeo':
      return 'Play';
    case 'google_drive':
      return 'HardDrive';
    case 'other':
      return 'Link';
    default:
      return 'Link';
  }
}

/**
 * Get platform display name
 */
export function getPlatformName(platform: PlatformType): string {
  switch (platform) {
    case 'youtube':
      return 'YouTube';
    case 'vimeo':
      return 'Vimeo';
    case 'google_drive':
      return 'Google Drive';
    case 'other':
      return 'External Link';
    default:
      return 'Link';
  }
}

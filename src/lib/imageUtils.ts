/**
 * Utility to convert share links (like Google Drive or Dropbox) into direct image URLs.
 */
export function formatImageUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();

  // Handle Google Drive links
  // Pattern 1: https://drive.google.com/file/d/1YXMgOfYxwkVk60QwQkxHOl2copt1hYex/view?usp=sharing
  const driveFileMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
  if (driveFileMatch && driveFileMatch[1]) {
    const fileId = driveFileMatch[1];
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }

  // Pattern 2: https://drive.google.com/open?id=FILE_ID or https://drive.google.com/uc?id=FILE_ID
  const driveIdMatch = trimmed.match(/drive\.google\.com\/.*[?&]id=([a-zA-Z0-9_-]+)/i);
  if (driveIdMatch && driveIdMatch[1]) {
    const fileId = driveIdMatch[1];
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }

  // Handle Dropbox links
  if (trimmed.includes('dropbox.com')) {
    return trimmed
      .replace('dl=0', 'raw=1')
      .replace('www.dropbox.com', 'dl.dropboxusercontent.com');
  }

  return trimmed;
}

export function isGoogleDriveUrl(url: string): boolean {
  if (!url) return false;
  return /drive\.google\.com/i.test(url);
}

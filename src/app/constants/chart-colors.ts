/**
 * Consistent color scheme for sections across all charts
 */

export interface SectionColor {
  backgroundColor: string;
  borderColor: string;
}

export const SECTION_COLORS: Record<string, SectionColor> = {
  'administrativo': {
    backgroundColor: 'rgba(255, 206, 86, 0.8)',  // Yellow
    borderColor: 'rgba(255, 206, 86, 1)'
  },
  'medio ambiente': {
    backgroundColor: 'rgba(75, 192, 192, 0.8)',  // Green
    borderColor: 'rgba(75, 192, 192, 1)'
  },
  'costas': {
    backgroundColor: 'rgba(255, 159, 64, 0.8)',  // Orange
    borderColor: 'rgba(255, 159, 64, 1)'
  },
  'aguas': {
    backgroundColor: 'rgba(54, 162, 235, 0.8)', // Blue
    borderColor: 'rgba(54, 162, 235, 1)'
  },
  'total': {
    backgroundColor: 'rgba(255, 99, 132, 0.8)',  // Red
    borderColor: 'rgba(255, 99, 132, 1)'
  },
  'varias': {
    backgroundColor: 'rgba(255, 99, 132, 0.8)',  // Red (same as total)
    borderColor: 'rgba(255, 99, 132, 1)'
  }
};

/**
 * Get color for a specific section
 * @param sectionName - Name of the section
 * @returns SectionColor object with backgroundColor and borderColor
 */
export function getSectionColor(sectionName: string): SectionColor {
  const normalizedName = sectionName.toLowerCase();
  return SECTION_COLORS[normalizedName] || {
    backgroundColor: 'rgba(201, 203, 207, 0.8)', // Default gray
    borderColor: 'rgba(201, 203, 207, 1)'
  };
}

/**
 * Get array of background colors for multiple sections
 * @param sectionNames - Array of section names
 * @returns Array of background color strings
 */
export function getSectionBackgroundColors(sectionNames: string[]): string[] {
  return sectionNames.map(name => getSectionColor(name).backgroundColor);
}

/**
 * Get array of border colors for multiple sections
 * @param sectionNames - Array of section names
 * @returns Array of border color strings
 */
export function getSectionBorderColors(sectionNames: string[]): string[] {
  return sectionNames.map(name => getSectionColor(name).borderColor);
}
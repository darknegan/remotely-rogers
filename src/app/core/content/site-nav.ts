export interface SiteLink {
  label: string;
  path: string;
  exact?: boolean;
}

export const SITE_LINKS: SiteLink[] = [
  { label: 'Home', path: '/', exact: true },
  { label: 'Cabins', path: '/cabins' },
  { label: 'Activities', path: '/activities' },
  { label: 'Recommendations', path: '/recommendations' },
  { label: 'Work Stays', path: '/work-stays' },
  { label: 'Multi-Cabin', path: '/multi-cabin' },
  { label: 'Contact', path: '/contact' },
];

export const SITE_PHONE = '479-440-5011';
export const SITE_PHONE_TEL = 'tel:4794405011';
export const SITE_EMAIL = 'Jeff@remotelyrogers.com';
export const SITE_EMAIL_MAILTO = 'mailto:Jeff@remotelyrogers.com';
export const SITE_ADDRESS = '11611–11601 Lindy Lane, Rogers, AR 72756';
export const SITE_INSTAGRAM = 'https://instagram.com/remotely.rogers';
export const SITE_MAP_LINK = 'https://maps.google.com/?q=11611+Lindy+Lane+Rogers+AR+72756';
export const SITE_MAP_EMBED =
  'https://maps.google.com/maps?q=11611+Lindy+Lane+Rogers+AR+72756&z=13&output=embed';

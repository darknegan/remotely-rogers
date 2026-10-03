export interface NavLink {
  label: string;
  path: string;
}

/** Primary site navigation — public Ozark maison routes. */
export const SITE_NAV_LINKS: NavLink[] = [
  { label: 'Home', path: '/' },
  { label: 'Cabins', path: '/cabins' },
  { label: 'Activities', path: '/activities' },
  { label: 'Recommendations', path: '/recommendations' },
  { label: 'Work Stays', path: '/work-stays' },
  { label: 'Multi-Cabin', path: '/multi-cabin' },
  { label: 'Contact', path: '/contact' },
];

export const FOOTER_NAV_LINKS: NavLink[] = [
  { label: 'Cabins', path: '/cabins' },
  { label: 'Activities', path: '/activities' },
  { label: 'Recommendations', path: '/recommendations' },
  { label: 'Work Stays', path: '/work-stays' },
  { label: 'Multi-Cabin', path: '/multi-cabin' },
  { label: 'Contact', path: '/contact' },
];

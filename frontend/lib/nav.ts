export type NavItem = { name: string; icon: string; href: string };
export type NavGroup = { group: string; items: NavItem[] };

export const APP_NAV: NavItem[] = [
  { name: "Dashboard", icon: "ic-grid", href: "/dashboard" },
  { name: "Learn", icon: "ic-book", href: "/learn" },
  { name: "Cyber Range", icon: "ic-term", href: "/range" },
  { name: "CTF Arena", icon: "ic-flag", href: "/ctf" },
  { name: "Red vs Blue", icon: "ic-shield", href: "/red-vs-blue" },
  { name: "Leaderboard", icon: "ic-chart", href: "/leaderboard" },
  { name: "Certifications", icon: "ic-award", href: "/certificates" },
  { name: "Community", icon: "ic-users", href: "/community" },
];

export const ADMIN_NAV: NavGroup[] = [
  { group: "Platform", items: [{ name: "Overview", icon: "a-grid", href: "/admin" }] },
  {
    group: "People",
    items: [
      { name: "Users", icon: "a-users", href: "/admin/users" },
      { name: "Participants", icon: "a-user", href: "/admin/participants" },
      { name: "Exam Attempts", icon: "a-lock", href: "/admin/exam-attempts" },
    ],
  },
  {
    group: "Content",
    items: [
      { name: "Labs", icon: "a-doc", href: "/admin/labs" },
      { name: "Cyber Range", icon: "a-term", href: "/admin/range" },
      { name: "CTF / Tasks", icon: "a-flag", href: "/admin/ctf" },
      { name: "Cert Tracks", icon: "a-award", href: "/admin/cert-tracks" },
      { name: "Submissions", icon: "a-check", href: "/admin/submissions" },
      { name: "Certificates", icon: "a-cert", href: "/admin/certificates" },
    ],
  },
  {
    group: "Engagement",
    items: [
      { name: "Community", icon: "a-msg", href: "/admin/community" },
      { name: "Live Events", icon: "a-video", href: "/admin/live-events" },
    ],
  },
  { group: "Organizations", items: [{ name: "Organizations", icon: "a-building", href: "/admin/organizations" }] },
  {
    group: "System",
    items: [
      { name: "Releases", icon: "a-tag", href: "/admin/releases" },
      { name: "Design", icon: "a-brush", href: "/admin/design" },
    ],
  },
];

export const MKT_LINKS = [
  { name: "Home", href: "/" },
  { name: "About", href: "/#about" },
  { name: "Courses", href: "/courses" },
  { name: "Contact Us", href: "/#contact" },
];

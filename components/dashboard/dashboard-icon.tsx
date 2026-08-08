import type { SVGProps } from "react";

const paths = {
  activity: "M4 12h3l2-6 4 12 2-6h5",
  calendar: "M6 3v3m12-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z",
  check: "m5 12 4 4L19 6",
  clock: "M12 7v5l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  history: "M3 12a9 9 0 1 0 3-6.7L3 8m0 0h5M3 8V3m9 4v5l3 2",
  home: "m3 11 9-8 9 8v10h-6v-6H9v6H3Z",
  medicine: "M8.5 4.5a4.95 4.95 0 0 1 7 7l-4 4a4.95 4.95 0 0 1-7-7Zm0 0 7 7M14 16h7m-3.5-3.5v7",
  menu: "M4 7h16M4 12h16M4 17h16",
  progress: "M4 19V9m6 10V5m6 14v-7m4 7H2",
  spark: "m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8Z",
  user: "M20 21a8 8 0 0 0-16 0m8-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
} as const;

export function DashboardIcon({
  name,
  ...props
}: SVGProps<SVGSVGElement> & { name: keyof typeof paths }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
      {...props}
    >
      <path d={paths[name]} />
    </svg>
  );
}

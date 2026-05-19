/**
 * Aliasing centralisé des icônes Heroicons 24/outline (stroke 1.5)
 * + icônes custom non présentes dans Heroicons (Bike, CircleDot).
 *
 * Source de vérité : `docs/design-system/README.md` § Iconography
 * (décision yako-san 2026-05-19 — migration globale Lucide → Heroicons).
 *
 * Conventions :
 * - Toujours importer depuis `@/components/icons` (pas `@heroicons/react/24/outline`).
 * - Sizing via Tailwind `h-{n} w-{n}` ou `className` (pas de prop `size`).
 * - Heroicons 24/outline a déjà `stroke-width="1.5"` par défaut.
 */

export {
  ArchiveBoxIcon as ArchiveIcon,
  ArrowPathIcon,
  ArrowUpTrayIcon as UploadIcon,
  Bars3Icon as MenuIcon,
  BellIcon,
  CalendarIcon,
  CheckCircleIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  Cog6ToothIcon as CogIcon,
  CubeIcon as PackageIcon,
  CurrencyDollarIcon as DollarSignIcon,
  DocumentTextIcon as FileTextIcon,
  EnvelopeIcon as MailIcon,
  ExclamationCircleIcon as AlertCircleIcon,
  EyeIcon,
  MagnifyingGlassIcon as SearchIcon,
  PaperAirplaneIcon as SendIcon,
  PencilSquareIcon as FileEditIcon,
  PhotoIcon,
  PlusIcon,
  QrCodeIcon,
  ReceiptPercentIcon as ReceiptIcon,
  ShoppingCartIcon,
  TrashIcon,
  UsersIcon,
  WrenchScrewdriverIcon as WrenchIcon,
  XMarkIcon as XIcon,
  // Icônes utilisées par la sidebar/popover (alias inchangés).
  ArchiveBoxIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  CurrencyDollarIcon,
  QuestionMarkCircleIcon,
  Squares2X2Icon as DashboardIcon,
  Squares2X2Icon as LayoutDashboardIcon,
  TagIcon,
  BanknotesIcon,
  IdentificationIcon as ContactIcon,
  // Mapping additionnel (Lucide V2 → Heroicons).
  InboxIcon,
  ClipboardDocumentCheckIcon as ClipboardCheckIcon,
  ClipboardDocumentListIcon as ClipboardListIcon,
  Square3Stack3DIcon as LayersIcon,
  DevicePhoneMobileIcon as SmartphoneIcon,
  BanknotesIcon as BanknoteIcon,
  BuildingOffice2Icon as Building2Icon,
  ViewfinderCircleIcon as ScanLineIcon,
  ServerIcon as HardDriveIcon,
  CloudIcon as CloudCogIcon,
  ExclamationTriangleIcon as AlertTriangleIcon,
  ClockIcon,
  CubeIcon as PackageOpenIcon,
  ArrowsRightLeftIcon as WorkflowIcon,
  ListBulletIcon as ListChecksIcon,
} from '@heroicons/react/24/outline';

import * as React from 'react';

/**
 * Icône vélo custom — pas de Bike dans Heroicons 24/outline.
 * SVG path repris de la preview design-system (components-sidebar.html /
 * components-kpi-card.html). Stroke 1.5 pour homogénéité.
 */
export const BikeIcon = React.forwardRef<
  SVGSVGElement,
  React.SVGProps<SVGSVGElement>
>(function BikeIcon(props, ref) {
  return (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <circle cx="6" cy="15" r="4" />
      <circle cx="18" cy="15" r="4" />
      <path d="m6 15 6-7h4l-4 9" />
      <path d="M14 8h-2" />
    </svg>
  );
});

/**
 * Point plein — utilisé par `DropdownMenuRadioItem` comme indicateur
 * de sélection. Heroicons n'a pas d'équivalent direct de `Circle`
 * (lucide) en version "rempli petit". On le synthétise.
 */
export const CircleDotIcon = React.forwardRef<
  SVGSVGElement,
  React.SVGProps<SVGSVGElement>
>(function CircleDotIcon(props, ref) {
  return (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <circle cx="12" cy="12" r="4" />
    </svg>
  );
});

/**
 * Type d'icône à passer en prop (ex: sidebar item, KPI). Toutes les
 * Heroicons sont des `ForwardRefExoticComponent` ; on accepte aussi
 * nos wrappers custom (BikeIcon, CircleDotIcon).
 */
export type IconComponent = React.ForwardRefExoticComponent<
  React.SVGProps<SVGSVGElement> & React.RefAttributes<SVGSVGElement>
> | React.ComponentType<React.SVGProps<SVGSVGElement>>;

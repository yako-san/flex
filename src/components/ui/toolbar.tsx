import * as React from 'react';
import { PlusIcon } from '@/components/icons';

/**
 * ToolbarBlock — Bloc foncé pill contenant les boutons de toolbar V1.
 * rgba(0,0,0,0.20) sur fond gris → effet verre sombre.
 */
export function ToolbarBlock({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex items-center"
      style={{
        height: '50px',
        backgroundColor: 'rgba(0,0,0,0.20)',
        borderRadius: '50px',
        padding: '0 9px',
        gap: '10px',
      }}
    >
      {children}
    </div>
  );
}

/**
 * ToolbarBtn — Bouton texte dans un ToolbarBlock.
 * off : rgba(255,255,255,0.30) | hover : rgba(255,255,255,0.60) | actif : jaune
 */
export function ToolbarBtn({
  active = false,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="transition-colors"
      style={{
        height: '34px',
        padding: '0 14px',
        borderRadius: '50px',
        border: 'none',
        backgroundColor: 'transparent',
        color: active ? '#fff056' : 'rgba(255,255,255,0.30)',
        fontSize: '13px',
        fontWeight: 600,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        // Force centrage vertical du texte : flex au lieu du line-box.
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        lineHeight: 1,
      }}
      onMouseEnter={e => {
        if (!active) (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.60)';
      }}
      onMouseLeave={e => {
        if (!active) (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.30)';
      }}
    >
      {children}
    </button>
  );
}

/**
 * AddButton — Bouton (+) rond jaune 37px V1.
 */
export function AddButton({
  onClick,
  title = 'Ajouter',
  disabled = false,
  href,
}: {
  onClick?: () => void;
  title?: string;
  disabled?: boolean;
  href?: string;
}) {
  const style: React.CSSProperties = {
    width: '37px',
    height: '37px',
    borderRadius: '50%',
    backgroundColor: disabled ? 'rgba(255,255,255,0.2)' : '#fff056',
    color: disabled ? 'rgba(0,0,0,0.3)' : '#000',
    border: disabled ? '1.5px solid rgba(255,255,255,0.3)' : 'none',
    fontSize: '22px',
    fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
    lineHeight: 1,
    opacity: disabled ? 0.5 : 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'background-color 150ms ease',
    textDecoration: 'none',
  };

  // Icône SVG dead-center (mathématiquement) — remplace le glyphe `+`
  // de Helvetica qui s'asseyait optiquement haut dans le pill.
  const icon = <PlusIcon className="h-5 w-5" strokeWidth={2.5} aria-hidden />;

  if (href && !disabled) {
    return (
      <a href={href} style={style} title={title} aria-label={title}>
        {icon}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={style}
      title={disabled ? 'Action indisponible' : title}
      aria-label={title}
    >
      {icon}
    </button>
  );
}

/**
 * UtilButton — Bouton utilitaire outline jaune 32px V1.
 */
export function UtilButton({
  onClick,
  title,
  children,
}: {
  onClick?: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center transition-colors"
      style={{
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        backgroundColor: 'transparent',
        color: '#fff056',
        border: '2px solid #fff056',
        cursor: 'pointer',
        flexShrink: 0,
      }}
      title={title}
    >
      <span style={{ width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </span>
    </button>
  );
}

/**
 * SearchInput — Champ de recherche dans un ToolbarBlock V1.
 */
export function SearchInput({
  value,
  onChange,
  placeholder = 'Rechercher…',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="search"
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        height: '32px',
        borderRadius: '32px',
        backgroundColor: 'rgba(255,255,255,0.7)',
        color: 'rgba(0,0,0,0.7)',
        border: 'none',
        width: '200px',
        fontSize: '13px',
        padding: '0 16px',
        outline: 'none',
        lineHeight: 1,
      }}
    />
  );
}

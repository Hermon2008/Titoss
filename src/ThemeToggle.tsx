import { Moon, Sun } from 'lucide-react';
import type { Theme } from './theme';

export default function ThemeToggle({ theme, onToggle }: { theme: Theme; onToggle: () => void }) {
  return (
    <button role="switch" aria-checked={theme === 'dark'} aria-label="Mode sombre" className="switch" onClick={onToggle}>
      <Sun size={14} aria-hidden="true" /><span className="knob" /><Moon size={14} aria-hidden="true" />
    </button>
  );
}

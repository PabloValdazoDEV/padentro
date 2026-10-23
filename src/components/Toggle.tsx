import { haptic } from '../haptics';

interface Props {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

export default function Toggle({ label, description, checked, onChange }: Props) {
  return (
    <label className="toggle-row">
      <span className="toggle-text">
        <strong>{label}</strong>
        {description && <small>{description}</small>}
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(e) => {
          onChange(e.target.checked);
          haptic();
        }}
      />
      <span className="switch" aria-hidden />
    </label>
  );
}

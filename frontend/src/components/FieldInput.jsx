// One input for any field from GET /reports/form-schema.
// Types: text | textarea | number (whole number) | currency ($, up to 2 decimals)
export const MAX_TEXT = 2000;

export default function FieldInput({ field, value, error, onChange, disabled }) {
  const id = `field-${field.key}`;
  const describedBy = error ? `${id}-error` : undefined;
  const common = {
    id,
    name: field.key,
    value: value ?? '',
    disabled,
    'aria-invalid': Boolean(error),
    'aria-describedby': describedBy,
    onChange: (e) => onChange(field.key, e.target.value),
  };

  let input;
  if (field.type === 'textarea') {
    input = (
      <>
        <textarea rows={3} maxLength={MAX_TEXT} {...common} />
        <span className="char-count">
          {(value ?? '').length}/{MAX_TEXT}
        </span>
      </>
    );
  } else if (field.type === 'number') {
    input = <input type="number" inputMode="numeric" min="0" step="1" {...common} />;
  } else if (field.type === 'currency') {
    input = (
      <div className="money-input">
        <span aria-hidden="true">$</span>
        <input type="number" inputMode="decimal" min="0" step="0.01" placeholder="0.00" {...common} />
      </div>
    );
  } else {
    input = <input type="text" maxLength={MAX_TEXT} {...common} />;
  }

  return (
    <div className={error ? 'field has-error' : 'field'}>
      <label htmlFor={id}>
        {field.label}
        {field.required && <span className="required"> *</span>}
      </label>
      {field.key === 'blockers' && <span className="hint">Shown to the CEO on the company overview.</span>}
      {input}
      {error && (
        <span className="field-error" id={describedBy}>
          {error}
        </span>
      )}
    </div>
  );
}

import { useEffect, useRef } from 'react';

export default function GameModal({ title, children, actions }) {
  const ref = useRef(null);
  useEffect(() => { ref.current?.querySelector('button')?.focus(); }, []);
  return (
    <div className="overlay">
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} ref={ref}>
        <h2>{title}</h2>
        <p>{children}</p>
        <div className="modal-actions">
          {actions.map((a) => (
            <button key={a.label} className={`btn ${a.primary ? 'primary' : ''}`} onClick={a.onClick}>{a.label}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

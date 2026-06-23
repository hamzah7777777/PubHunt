import type { CSSProperties, ReactNode } from 'react';

const frameStyle: CSSProperties = {
  width: '100%',
  maxWidth: 420,
  aspectRatio: '9 / 16',
  margin: '0 auto',
  overflowY: 'auto',
  overflowX: 'hidden',
  borderRadius: 0,
  boxShadow: '0 12px 30px rgba(0,0,0,0.35)',
};

export default function HintFrame({ children }: { children: ReactNode }) {
  return <div style={frameStyle}>{children}</div>;
}

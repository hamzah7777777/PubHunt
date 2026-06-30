import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import JoinPage from '../pages/JoinPage';
import '../globals.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <JoinPage />
  </StrictMode>,
);

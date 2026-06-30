import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import DisplayPage from '../pages/DisplayPage';
import '../globals.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DisplayPage />
  </StrictMode>,
);

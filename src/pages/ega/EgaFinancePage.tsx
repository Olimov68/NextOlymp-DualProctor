import React from 'react';
import { Navigate } from 'react-router-dom';

export const EgaFinancePage: React.FC = () => {
  return <Navigate to="/ega" replace />;
};

export default EgaFinancePage;

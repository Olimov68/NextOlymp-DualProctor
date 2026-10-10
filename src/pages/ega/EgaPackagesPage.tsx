import React from 'react';
import { Navigate } from 'react-router-dom';

export const EgaPackagesPage: React.FC = () => {
  return <Navigate to="/ega" replace />;
};

export default EgaPackagesPage;

import React from 'react';

interface DaaronLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export const DaaronLogo: React.FC<DaaronLogoProps> = ({ 
  className = "h-10 w-auto",
  size = 'md' 
}) => {
  return (
    <img 
      src="/L.png" 
      alt="Daaron Consulta Dental" 
      className={`${className} object-contain transition-transform hover:scale-105`}
      onError={(e) => {
        // Fallback to inline SVG if needed
        const target = e.currentTarget;
        target.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 160'><ellipse cx='200' cy='80' rx='190' ry='72' fill='%23c59b27'/><ellipse cx='200' cy='80' rx='175' ry='60' fill='%23008375'/><text x='200' y='95' font-size='48' font-weight='bold' fill='%23c026d3' stroke='white' stroke-width='4' paint-order='stroke fill' text-anchor='middle' font-family='sans-serif'>Daaron</text><text x='200' y='125' font-size='16' font-weight='bold' fill='white' text-anchor='middle' font-family='sans-serif'>CONSULTA DENTAL</text></svg>";
      }}
    />
  );
};

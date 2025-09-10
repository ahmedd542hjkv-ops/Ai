import React from 'react';

interface IconProps {
  // Fix: Explicitly type the svg prop's generic to `any`.
  // This resolves an issue where TypeScript inferred the props as `unknown`,
  // causing errors with `React.cloneElement` and accessing `svg.props.className`.
  svg: React.ReactElement<any>;
  className?: string;
}

const Icon: React.FC<IconProps> = ({ svg, className }) => {
  return React.cloneElement(svg, {
    className: `${svg.props.className || ''} ${className || ''}`.trim(),
  });
};

export default Icon;

import React, { useState } from 'react';

export default function AppLogo({
  className = 'w-8 h-8',
  imgClassName = 'w-full h-full object-contain',
  rounded = 'rounded-xl',
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${rounded} overflow-hidden ${className}`}
    >
      {!imgError ? (
        <img
          src="/time-management.png"
          alt="Work Log System"
          className={imgClassName}
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-tr from-indigo-500 to-sky-400 text-white flex items-center justify-center font-bold text-xs tracking-tight">
          WL
        </div>
      )}
    </div>
  );
}

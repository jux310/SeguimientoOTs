import React from 'react';

export function Watermark() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="text-red-500 text-9xl font-bold opacity-20 rotate-[-30deg] select-none">
        PRÓXIMAMENTE
      </div>
    </div>
  );
}
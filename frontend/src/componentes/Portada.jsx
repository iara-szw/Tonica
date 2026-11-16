 import React, { useState } from 'react';

const Portada = ({ url, alt, tipo }) => {
  const [error, setError] = useState(false);
  const esCancion = tipo === 'track';

  if (!url || error) {
    return esCancion ? (
      <div className="disc-placeholder">
        <div className="disc-hole"></div>
      </div>
    ) : (
      <div className="album-placeholder"></div>
    );
  }

  return (
    <div className={esCancion ? 'disc-placeholder' : 'album-placeholder'}>
      <img
        src={url}
        alt={alt}
        onError={() => setError(true)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          borderRadius: esCancion ? '50%' : '8px'
        }}
      />
    </div>
  );
};

export default Portada;
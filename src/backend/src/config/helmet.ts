import { HelmetOptions } from 'helmet';

/**
 * Helmet security configuration
 */
export const helmetConfig: HelmetOptions = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        'https://cdn.jsdelivr.net',
        'https://api.mapbox.com',
        'https://cdnjs.cloudflare.com',
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        'https://cdn.jsdelivr.net',
        'https://api.mapbox.com',
        'https://fonts.googleapis.com',
        'https://cdnjs.cloudflare.com',
      ],
      connectSrc: [
        "'self'",
        'https://api.mapbox.com',
        'https://events.mapbox.com',
        'https://cdn.jsdelivr.net',
        'https://*.tiles.mapbox.com',
        'https://*.mapbox.com',
      ],
      imgSrc: [
        "'self'",
        'data:',
        'blob:',
        'https://images.unsplash.com',
        'https://res.cloudinary.com',
        'https://api.mapbox.com',
        'https://*.mapbox.com',
      ],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'https://cdn.jsdelivr.net'],
      workerSrc: ["'self'", 'blob:'],
      childSrc: ['blob:'],
      frameSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
};

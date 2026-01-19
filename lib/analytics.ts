// Google Analytics Event Tracking
// Measurement ID: G-8SSXDRYL30

export const GA_MEASUREMENT_ID = 'G-8SSXDRYL30';

// Track page views
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
    });
  }
};

// Track custom events
export const event = (action: string, params?: Record<string, any>) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', action, params);
  }
};

// Common event helpers
export const trackButtonClick = (buttonName: string) => {
  event('button_click', {
    button_name: buttonName,
  });
};

export const trackCTAClick = (ctaType: 'trial' | 'demo' | 'pricing') => {
  event('cta_click', {
    cta_type: ctaType,
  });
};

export const trackFeatureView = (featureName: string) => {
  event('feature_view', {
    feature_name: featureName,
  });
};

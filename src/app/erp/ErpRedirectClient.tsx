'use client';

import { useEffect } from 'react';

export default function ErpRedirectClient() {
  useEffect(() => {
    window.location.replace('/dashboard/');
  }, []);

  return null;
}

/**
 * Index Route - Redirects to Catalog
 * The catalog is the main entry point for the application
 */

import { redirect } from 'react-router';

export function loader() {
  // Redirect to catalog as the main app entry point
  return redirect('/catalog');
}

export default function Index() {
  // This component won't render due to loader redirect
  return null;
}

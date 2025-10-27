import { redirect } from 'next/navigation';

/**
 * The root page of the application.
 * It immediately redirects the user to the workshops page,
 * which will be handled by the authentication middleware.
 */
export default function HomePage() {
  redirect('/workshops');
}
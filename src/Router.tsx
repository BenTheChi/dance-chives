import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AboutPage } from './pages/AboutPage';
import { CommunityPage } from './pages/CommunityPage';
import { ContactPage } from './pages/ContactPage';
import { EducationPage } from './pages/EducationPage';
import { EventsPage } from './pages/EventsPage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { SupportPage } from './pages/SupportPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/events',
    element: <EventsPage />,
  },
  {
    path: '/profile',
    element: <ProfilePage />,
  },
  {
    path: '/settings',
    element: <SettingsPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/about',
    element: <AboutPage />,
  },
  {
    path: '/contact',
    element: <ContactPage />,
  },
  {
    path: '/support',
    element: <SupportPage />,
  },
  {
    path: '/education',
    element: <EducationPage />,
  },
  {
    path: '/community',
    element: <CommunityPage />,
  },
  {
    path: '/series',
    element: <CommunityPage />,
  },
]);

export function Router() {
  return <RouterProvider router={router} />;
}

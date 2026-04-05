import { createBrowserRouter } from 'react-router-dom';
import { MainLayout } from '@presentation/components/layout/MainLayout';
import { SchedulerPage } from '@presentation/pages/cpu-scheduler/SchedulerPage';
import { HomePage } from '@presentation/pages/home-portal/HomePage';
import { NotFoundPage } from '@presentation/pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      {
        path: '/',
        element: <HomePage />,
      },
      {
        path: '/cpu-scheduler',
        element: <SchedulerPage />,
      },
      {
        path: '/algo/banker',
        // Placeholder — will be implemented in Phase 3
        element: <div className="p-8 text-center text-muted-foreground">Banker's Algorithm — Coming Soon</div>,
      },
      {
        path: '/algo/deadlock-detection',
        // Placeholder — will be implemented in Phase 3
        element: <div className="p-8 text-center text-muted-foreground">Deadlock Detection — Coming Soon</div>,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);

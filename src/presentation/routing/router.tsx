import { createBrowserRouter } from 'react-router-dom';
import { MainLayout } from '@presentation/components/layout/MainLayout';
import { SchedulerPage } from '@presentation/pages/cpu-scheduler/SchedulerPage';
import { HomePage } from '@presentation/pages/home-portal/HomePage';
import { BankersPage } from '@presentation/pages/bankers-algorithm/BankersPage';
import { DeadlockPage } from '@presentation/pages/deadlock-detection/DeadlockPage';
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
        element: <BankersPage />,
      },
      {
        path: '/algo/deadlock-detection',
        element: <DeadlockPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);

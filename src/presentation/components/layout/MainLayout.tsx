import { Outlet } from 'react-router-dom';
import { TopNav } from './TopNav';

export function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopNav />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t py-4 px-4 lg:px-8">
        <div className="container mx-auto max-w-7xl text-center text-sm text-muted-foreground">
          <p>cpuflow — OS Resource Allocation Simulators</p>
        </div>
      </footer>
    </div>
  );
}

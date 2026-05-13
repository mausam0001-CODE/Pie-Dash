import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';

const Dashboard = lazy(() => import('../pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Library = lazy(() => import('../pages/Library').then(m => ({ default: m.Library })));
const Analytics = lazy(() => import('../pages/Analytics').then(m => ({ default: m.Analytics })));
const CalendarView = lazy(() => import('../pages/CalendarView').then(m => ({ default: m.CalendarView })));
const Workflow = lazy(() => import('../pages/Workflow').then(m => ({ default: m.Workflow })));
const Connections = lazy(() => import('../pages/Connections').then(m => ({ default: m.Connections })));
const Settings = lazy(() => import('../pages/Settings').then(m => ({ default: m.Settings })));
const Interactions = lazy(() => import('../pages/Interactions').then(m => ({ default: m.Interactions })));
const CompetitorInsights = lazy(() => import('../pages/CompetitorInsights').then(m => ({ default: m.CompetitorInsights })));

import { ErrorBoundary } from '../components/ErrorBoundary';
import { DashboardSkeleton, KanbanColumnSkeleton, ChartSkeleton, PostCardSkeleton } from '../components/Skeleton';

const skeletonMap: Record<string, React.ReactNode> = {
    dashboard: <DashboardSkeleton />,
    workflow: (
        <div className="flex gap-6 overflow-x-hidden h-[calc(100vh-10rem)] mt-8">
            {[1, 2, 3, 4].map(i => <KanbanColumnSkeleton key={i} />)}
        </div>
    ),
    analytics: (
        <div className="space-y-8 mt-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">{[1, 2, 3, 4].map(i => <div key={i} className="animate-pulse bg-white rounded-3xl h-32 border border-slate-100" />)}</div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8"><ChartSkeleton /><ChartSkeleton /></div>
        </div>
    ),
    library: (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <PostCardSkeleton key={i} />)}
        </div>
    ),
};

const wrap = (Component: React.ComponentType<any>, skeletonKey = 'dashboard') => (
    <ErrorBoundary>
        <Suspense fallback={skeletonMap[skeletonKey] ?? skeletonMap.dashboard}>
            <Component />
        </Suspense>
    </ErrorBoundary>
);

import { AuthGuard } from './AuthGuard';

export const router = createBrowserRouter([
    {
        path: '/',
        element: <AuthGuard><DashboardLayout /></AuthGuard>,
        children: [
            { index: true, element: wrap(Dashboard, 'dashboard') },
            { path: 'library', element: wrap(Library, 'library') },
            { path: 'analytics', element: wrap(Analytics, 'analytics') },
            { path: 'calendar', element: wrap(CalendarView, 'dashboard') },
            { path: 'workflow', element: wrap(Workflow, 'workflow') },
            { path: 'connections', element: wrap(Connections, 'dashboard') },
            { path: 'settings', element: wrap(Settings, 'dashboard') },
            { path: 'interactions', element: wrap(Interactions, 'dashboard') },
            { path: 'competitor-insights', element: wrap(CompetitorInsights, 'analytics') },
            { path: '*', element: <Navigate to="/" replace /> }
        ]
    }
]);

import { Routes, Route, Navigate } from 'react-router-dom';
import { MobileShell } from './shell/MobileShell';
import { HomeScreen } from './screens/HomeScreen';
import { IssuesScreen } from './screens/IssuesScreen';
import { ProjectsScreen } from './screens/ProjectsScreen';
import { ProjectDetailScreen } from './screens/ProjectDetailScreen';
import { SearchScreen } from './screens/SearchScreen';
import { BoardScreen } from './screens/BoardScreen';
import { CalendarScreen } from './screens/CalendarScreen';
import { TimelineScreen } from './screens/TimelineScreen';
import { GoalsScreen } from './screens/GoalsScreen';
import { PortfolioScreen } from './screens/PortfolioScreen';
import { WorkloadScreen } from './screens/WorkloadScreen';
import { ReportsScreen } from './screens/ReportsScreen';
import { DocsScreen } from './screens/DocsScreen';
import { SprintsScreen } from './screens/SprintsScreen';
import { TimeTrackingScreen } from './screens/TimeTrackingScreen';
import { TemplatesScreen } from './screens/TemplatesScreen';
import { AutomationsScreen } from './screens/AutomationsScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { NotFoundScreen } from './screens/NotFoundScreen';
import { LoginScreen } from './screens/auth/LoginScreen';
import { RegisterScreen } from './screens/auth/RegisterScreen';
import { ForgotPasswordScreen } from './screens/auth/ForgotPasswordScreen';
import { AuthGate } from './auth/AuthGate';

export default function App() {
  return (
    <Routes>
      {/* Unauthenticated */}
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/register" element={<RegisterScreen />} />
      <Route path="/forgot-password" element={<ForgotPasswordScreen />} />

      {/* Authenticated app shell */}
      <Route
        element={
          <AuthGate>
            <MobileShell />
          </AuthGate>
        }
      >
        {/* 4 bottom-nav tabs */}
        <Route index element={<HomeScreen />} />
        <Route path="/issues" element={<IssuesScreen />} />
        <Route path="/projects" element={<ProjectsScreen />} />
        <Route path="/search" element={<SearchScreen />} />

        {/* Destinations reachable via the top-bar switcher */}
        <Route path="/projects/:projectId" element={<ProjectDetailScreen />} />
        <Route path="/board" element={<BoardScreen />} />
        <Route path="/calendar" element={<CalendarScreen />} />
        <Route path="/timeline" element={<TimelineScreen />} />
        <Route path="/goals" element={<GoalsScreen />} />
        <Route path="/portfolio" element={<PortfolioScreen />} />
        <Route path="/workload" element={<WorkloadScreen />} />
        <Route path="/reports" element={<ReportsScreen />} />
        <Route path="/docs" element={<DocsScreen />} />
        <Route path="/sprints" element={<SprintsScreen />} />
        <Route path="/time-tracking" element={<TimeTrackingScreen />} />
        <Route path="/templates" element={<TemplatesScreen />} />
        <Route path="/automations" element={<AutomationsScreen />} />
        <Route path="/settings/*" element={<SettingsScreen />} />

        {/* Legacy aliases */}
        <Route path="/inbox" element={<Navigate to="/" replace />} />
        <Route path="/more" element={<Navigate to="/settings" replace />} />

        {/* 404 inside shell so top-bar + bottom-tabs remain visible */}
        <Route path="*" element={<NotFoundScreen />} />
      </Route>
    </Routes>
  );
}

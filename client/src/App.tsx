import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import SurveyPage from "@/pages/Survey";
import UniversitySelection from "@/pages/demo/UniversitySelection";
import DemoType from "@/pages/demo/DemoType";
import AdvisorLogin from "@/pages/demo/AdvisorLogin";
import AdvisorDashboard from "@/pages/demo/AdvisorDashboard";
import RespondentList from "@/pages/demo/RespondentList";
import InvitedStudents from "@/pages/demo/InvitedStudents";
import ComingSoon from "@/pages/demo/ComingSoon";
import { AdminLayout } from "@/pages/admin/AdminLayout";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminResponses from "@/pages/admin/Responses";
import AdminSurveyEditor from "@/pages/admin/SurveyEditor";
import AdminTaxonomies from "@/pages/admin/Taxonomies";
import AdminSettings from "@/pages/admin/Settings";
import AdminPreview from "@/pages/admin/Preview";
import AdminEmployers from "@/pages/admin/Employers";

function AdminRouter() {
  return (
    <AdminLayout>
      <Switch>
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/responses" component={AdminResponses} />
        <Route path="/admin/survey" component={AdminSurveyEditor} />
        <Route path="/admin/preview/:surveyConfigId" component={AdminPreview} />
        <Route path="/admin/employers" component={AdminEmployers} />
        <Route path="/admin/taxonomies" component={AdminTaxonomies} />
        <Route path="/admin/settings" component={AdminSettings} />
        <Route component={NotFound} />
      </Switch>
    </AdminLayout>
  );
}

function Router() {
  return (
    <Switch>
      {/* Demo flow — root is the entry point */}
      <Route path="/" component={UniversitySelection} />
      <Route path="/demo/type" component={DemoType} />
      <Route path="/demo/login" component={AdvisorLogin} />
      <Route path="/demo/dashboard" component={AdvisorDashboard} />
      <Route path="/demo/respondents" component={RespondentList} />
      <Route path="/demo/invited" component={InvitedStudents} />
      <Route path="/demo/coming-soon" component={ComingSoon} />

      {/* The survey flow now lives at /survey */}
      <Route path="/survey" component={SurveyPage} />

      {/* Admin dashboard and sub-routes */}
      <Route path="/admin/:rest*" component={AdminRouter} />
      <Route path="/admin" component={AdminRouter} />

      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

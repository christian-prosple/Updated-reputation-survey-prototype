import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import SurveyPage from "@/pages/Survey";
import { AdminLayout } from "@/pages/admin/AdminLayout";
import AdminLogin from "@/pages/admin/Login";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminResponses from "@/pages/admin/Responses";
import AdminSurveyEditor from "@/pages/admin/SurveyEditor";
import AdminTaxonomies from "@/pages/admin/Taxonomies";
import AdminSettings from "@/pages/admin/Settings";

function AdminRouter() {
  return (
    <AdminLayout>
      <Switch>
        <Route path="/admin/login" component={AdminLogin} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/responses" component={AdminResponses} />
        <Route path="/admin/survey" component={AdminSurveyEditor} />
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
      {/* 
        This is a Single Page App survey.
        The root path serves the Survey flow.
      */}
      <Route path="/" component={SurveyPage} />

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

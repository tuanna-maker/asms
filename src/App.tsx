import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/hooks/use-theme";
import { RoleProvider } from "@/hooks/use-role";
import { AuthProvider } from "@/hooks/use-auth";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";
import Login from "./pages/Login";
import Index from "./pages/Index";
import Contracts from "./pages/Contracts";
import Handover from "./pages/Handover";
import Warranty from "./pages/Warranty";
import Materials from "./pages/Materials";
import Products from "./pages/Products";
import Customers from "./pages/Customers";
import Feedbacks from "./pages/Feedbacks";
import FeedbackCreate from "./pages/FeedbackCreate";
import FeedbackDetail from "./pages/FeedbackDetail";
import FeedbackEdit from "./pages/FeedbackEdit";
import FeedbackStatistics from "./pages/FeedbackStatistics";
import Reports from "./pages/Reports";
import SettingsPage from "./pages/SettingsPage";
import AttributeSettingsPage from "./pages/AttributeSettingsPage";
import ResearchProjects from "./pages/ResearchProjects";
import ResearchProjectDetail from "./pages/ResearchProjectDetail";
import Tasks from "./pages/Tasks";
import Training from "./pages/Training";
import TrainingDetail from "./pages/TrainingDetail";
import Documents from "./pages/Documents";
import WorkflowOverviewPage from "./pages/WorkflowOverviewPage";
import WorkflowListPage from "./pages/WorkflowListPage";
import WorkflowEditorPage from "./pages/WorkflowEditorPage";
import NotificationsPage from "./pages/NotificationsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: { retry: 0 },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <RoleProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route element={<AppLayout />}>
                  <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                  <Route path="/hop-dong" element={<ProtectedRoute><Contracts /></ProtectedRoute>} />
                  <Route path="/ban-giao" element={<ProtectedRoute><Handover /></ProtectedRoute>} />
                  <Route path="/bao-hanh" element={<ProtectedRoute><Warranty /></ProtectedRoute>} />
                  <Route path="/vat-tu" element={<ProtectedRoute><Materials /></ProtectedRoute>} />
                  <Route path="/san-pham" element={<ProtectedRoute><Products /></ProtectedRoute>} />
                  <Route path="/khach-hang" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
                  <Route path="/phan-anh/thong-ke" element={<ProtectedRoute><FeedbackStatistics /></ProtectedRoute>} />
                  <Route path="/phan-anh/moi" element={<ProtectedRoute><FeedbackCreate /></ProtectedRoute>} />
                  <Route path="/phan-anh/:id/sua" element={<ProtectedRoute><FeedbackEdit /></ProtectedRoute>} />
                  <Route path="/phan-anh/:id" element={<ProtectedRoute><FeedbackDetail /></ProtectedRoute>} />
                  <Route path="/phan-anh" element={<ProtectedRoute><Feedbacks /></ProtectedRoute>} />
                  <Route path="/bao-cao" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
                  <Route path="/de-tai" element={<ProtectedRoute><ResearchProjects /></ProtectedRoute>} />
                  <Route path="/de-tai/:id" element={<ProtectedRoute><ResearchProjectDetail /></ProtectedRoute>} />
                  <Route path="/cong-viec" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
                  <Route path="/dao-tao" element={<ProtectedRoute><Training /></ProtectedRoute>} />
                  <Route path="/dao-tao/:id" element={<ProtectedRoute><TrainingDetail /></ProtectedRoute>} />
                  <Route path="/tai-lieu" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
                  <Route path="/quy-trinh" element={<ProtectedRoute><WorkflowOverviewPage /></ProtectedRoute>} />
                  <Route path="/quy-trinh/:moduleKey" element={<ProtectedRoute><WorkflowListPage /></ProtectedRoute>} />
                  <Route path="/quy-trinh/:moduleKey/:workflowId" element={<ProtectedRoute><WorkflowEditorPage /></ProtectedRoute>} />
                  <Route path="/thong-bao" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
                  <Route path="/cai-dat" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                  <Route path="/cai-dat/thuoc-tinh" element={<ProtectedRoute><AttributeSettingsPage /></ProtectedRoute>} />
                  <Route path="/cai-dat/thuoc-tinh/:moduleKey" element={<ProtectedRoute><AttributeSettingsPage /></ProtectedRoute>} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </RoleProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

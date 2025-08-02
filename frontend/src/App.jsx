import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import AccountSettings from "./pages/AccountSettings";
import WhiteboardEditor from "./pages/WhiteboardEditor";
import KanbanEditor from "./pages/KanbanEditor";
import PresentationEditor from "./pages/PresentationEditor";
import MindMapEditor from "./pages/MindMapEditor";
import FlowchartEditor from "./pages/FlowchartEditor";
import BrainstormingEditor from "./pages/BrainstormingEditor";
import MeetingEditor from "./pages/MeetingEditor";
import TemplateRouter from "./components/TemplateRouter";
import io from "socket.io-client";

export const socket = io("http://localhost:5000"); // Back to original port 5000
window.socket = socket; // so voice.js can access it

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/settings" element={<AccountSettings />} />
          <Route path="/board/:id" element={<TemplateRouter />} />
        {/* Direct routes for specific editors */}
        <Route path="/whiteboard/:id" element={<WhiteboardEditor />} />
        <Route path="/kanban/:id" element={<KanbanEditor />} />
        <Route path="/presentation/:id" element={<PresentationEditor />} />
        <Route path="/mindmap/:id" element={<MindMapEditor />} />
        <Route path="/flowchart/:id" element={<FlowchartEditor />} />
        <Route path="/brainstorming/:id" element={<BrainstormingEditor />} />
        <Route path="/meeting/:id" element={<MeetingEditor />} />
      </Routes>
    </Router>
    </ThemeProvider>
  );
}

export default App;

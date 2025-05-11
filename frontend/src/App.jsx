import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import WhiteboardEditor from "./pages/WhiteboardEditor";
import io from "socket.io-client";

export const socket = io("http://localhost:5000"); // or your backend URL
window.socket = socket; // so voice.js can access it

function App() {
  return (
    <Router>
      <Routes>
        {/* <Route path="/" element={<Landing />} /> */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/whiteboard/:id" element={<WhiteboardEditor />} />
      </Routes>
    </Router>
  );
}

export default App;

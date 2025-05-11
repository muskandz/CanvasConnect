import { useNavigate } from "react-router-dom";
import { auth } from "../firebaseConfig";
import { signOut, onAuthStateChanged } from "firebase/auth";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import ShareModal from "../components/ShareModal";

export default function Dashboard() {
  const navigate = useNavigate();
  const [boards, setBoards] = useState([]);
  const [user, setUser] = useState(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [selectedBoardId, setSelectedBoardId] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const res = await axios.get(`http://localhost:5000/api/boards/user/${currentUser.uid}`);
          setBoards(res.data);
        } catch (err) {
          console.error("Error fetching boards", err);
        }
      } else {
        navigate("/login"); // Redirect to login if not authenticated
      }
    });
    
    return () => unsubscribe();
  }, [navigate]);

  const handleNewBoard = async () => {
    if (!user) return;

    try {
      const response = await axios.post("http://localhost:5000/api/boards", {
        userId: user.uid,
        title: "Untitled Board",
      });

      console.log("Board created:", response.data);

      // Navigate to whiteboard editor
      navigate(`/whiteboard/${response.data.id}`);
    } catch (err) {
      console.error("Error creating board", err);
    }
  };

  const handleLogout = () => {
    signOut(auth).then(() => navigate("/login"));
  };

  return (
    <div className="p-4">
      <h2 className="text-xl mb-4">Welcome, {user?.email}</h2>
      <button
        onClick={handleNewBoard}
        className="mr-2 px-4 py-2 bg-blue-500 text-white rounded"
      >
        + New Whiteboard
      </button>
      <button
        onClick={handleLogout}
        className="px-4 py-2 bg-red-500 text-white rounded"
      >
        Logout
      </button>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {boards.map((board) => (
          <div key={board.id} className="p-3 border rounded shadow hover:bg-gray-100 cursor-pointer relative">
            <Link to={`/whiteboard/${board.id}`}>
              <h3 className="font-semibold">{board.title}</h3>
              <p className="text-xs text-gray-500">
                Created on: {new Date(board.createdAt).toLocaleString()}
              </p>
            </Link>
            <div className="flex mt-2 space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedBoardId(board.id);
                  setShareOpen(true);
                }}
                className="bg-indigo-500 text-white px-2 py-1 rounded text-xs"
              >
                Share
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  if (confirm("Are you sure you want to delete this board?")) {
                    axios.delete(`http://localhost:5000/api/boards/${board.id}`)
                      .then(() => setBoards(boards.filter(b => b.id !== board.id)))
                      .catch(console.error);
                  }
                }}
                className="bg-red-500 text-white px-2 py-1 rounded text-xs"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {/* Share Modal */}
      <ShareModal
        isOpen={shareOpen}
        setIsOpen={setShareOpen}
        boardId={selectedBoardId}
      />
    </div>
  );
}
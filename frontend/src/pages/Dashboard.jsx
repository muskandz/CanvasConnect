import { useNavigate } from "react-router-dom";
import { auth } from "../firebaseConfig";
import { signOut, onAuthStateChanged } from "firebase/auth";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  const [boards, setBoards] = useState([]);
  const [user, setUser] = useState(null);

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

      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
      {boards.map((board) => (
  <Link key={board.id} to={`/whiteboard/${board.id}`}>
    <div key={board.id} className="p-3 border rounded shadow hover:bg-gray-100 cursor-pointer relative">
  <Link to={`/whiteboard/${board.id}`}>
    <h3 className="font-semibold">{board.title}</h3>
    <p className="text-xs text-gray-500">
      Created on: {new Date(board.createdAt).toLocaleString()}
    </p>
  </Link>
  <button
    onClick={(e) => {
      e.stopPropagation();
      e.preventDefault();
      axios.delete(`http://localhost:5000/api/boards/${board.id}`)
        .then(() => setBoards(boards.filter(b => b.id !== board.id)))
        .catch(console.error);
    }}
    className="absolute top-1 right-1 text-red-500 text-xs"
  >
    ❌
  </button>
</div>
  </Link>
))}
      </div>
    </div>
  );
}
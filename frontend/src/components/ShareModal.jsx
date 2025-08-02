import { useState } from "react";
import { Dialog } from "@headlessui/react";
import axios from "axios";

export default function ShareModal({ isOpen, setIsOpen, boardId }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");

  const handleShare = async () => {
    if (!email) return;

    try {
      const res = await axios.patch(`http://localhost:5000/api/whiteboards/share/${boardId}`, {
        userIdToShare: email
      });
      setStatus(res.data.message);
      setEmail("");
    } catch (error) {
      setStatus("Error sharing board");
      console.error(error);
    }
  };

  return (
    <Dialog open={isOpen} onClose={() => setIsOpen(false)} className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <Dialog.Panel className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md relative">
        <Dialog.Title className="text-lg font-bold mb-2">Share Board</Dialog.Title>
        <input
          type="email"
          className="w-full border p-2 rounded mb-3"
          placeholder="Collaborator's email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <div className="flex justify-end gap-2">
          <button onClick={() => setIsOpen(false)} className="px-4 py-2 bg-gray-300 rounded">Cancel</button>
          <button onClick={handleShare} className="px-4 py-2 bg-blue-600 text-white rounded">Share</button>
        </div>
        {status && <p className="mt-3 text-sm text-green-600">{status}</p>}
      </Dialog.Panel>
    </Dialog>
  );
}
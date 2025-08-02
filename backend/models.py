def board_to_dict(board):
    return {
        "id": str(board["_id"]),
        "userId": board["userId"],
        "title": board["title"],
        "data": board.get("data", []),
        "notes": board.get("notes", []),  # ✅ Include notes in output
        "textBoxes": board.get("textBoxes", []),  # ✅ Include textBoxes in output
        "background": board.get("background", "#ffffff"),  # ✅ Include background
        "templateType": board.get("templateType", "whiteboard"),  # ✅ Include templateType
        "createdAt": board.get("createdAt")
    }

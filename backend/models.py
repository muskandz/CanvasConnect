def board_to_dict(board):
    return {
        "id": str(board["_id"]),
        "userId": board["userId"],
        "title": board["title"],
        "data": board.get("data", []),
        "notes": board.get("notes", []),  # ✅ Include notes in output
        "createdAt": board.get("createdAt")
    }

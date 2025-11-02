import React, { useState, useEffect } from "react";
import { doc, getDocs, collection, addDoc } from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";
import { format } from "date-fns";

const GuestMessages = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Fetch current user
    const currentUser = auth.currentUser;
    setUser(currentUser);

    // Fetch conversations for current user
    const fetchConversations = async () => {
      if (currentUser) {
        const conversationsRef = collection(db, "chats");
        const snapshot = await getDocs(conversationsRef);
        const userConversations = [];

        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.participants.includes(currentUser.uid)) {
            userConversations.push(data);
          }
        });

        setConversations(userConversations);
      }
    };

    fetchConversations();
  }, []);

  useEffect(() => {
  if (selectedConversation && selectedConversation.id) {
    const fetchMessages = async () => {
      try {
        // Check if selectedConversation.id exists and is valid
        if (!selectedConversation.id) {
          throw new Error("Conversation ID is invalid");
        }

        const chatRef = doc(db, "chats", selectedConversation.id);
        const messagesSnap = await getDocs(collection(chatRef, "messages"));
        const chatMessages = [];

        messagesSnap.forEach((messageDoc) => {
          chatMessages.push(messageDoc.data());
        });

        setMessages(chatMessages);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();
  }
}, [selectedConversation]);


  const handleSendMessage = async () => {
    if (messageText.trim() === "") return;

    try {
      const chatRef = doc(db, "chats", selectedConversation.id);

      // Add the new message to the chat
      await addDoc(collection(chatRef, "messages"), {
        senderId: user.uid,
        text: messageText,
        createdAt: new Date(),
      });

      setMessageText("");
      setMessages([...messages, { senderId: user.uid, text: messageText, createdAt: new Date() }]);
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const formatDate = (date) => {
    const validDate = new Date(date);
    return isNaN(validDate) ? null : format(validDate, "MMM dd, yyyy");
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Panel (Conversations List) */}
      <div className="w-1/3 bg-white shadow-lg p-5 overflow-y-auto">
        <h2 className="text-xl font-semibold text-olive-dark mb-4">Conversations</h2>
        <ul>
          {conversations.map((conversation) => (
            <li
              key={conversation.id}
              onClick={() => setSelectedConversation(conversation)}
              className="flex items-center p-4 hover:bg-gray-100 cursor-pointer rounded-xl transition"
            >
              <div className="w-12 h-12 bg-gray-300 rounded-full mr-4"></div> {/* Placeholder for avatar */}
              <div>
                <p className="font-medium text-gray-800">{conversation.name}</p>
                <p className="text-gray-600 text-sm">
                  {conversation.lastMessage ? conversation.lastMessage : "No messages yet"}
                </p>
                <span className="text-gray-400 text-xs">
                  {conversation.updatedAt ? formatDate(conversation.updatedAt) : "No date"}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Right Panel (Message Detail) */}
      <div className="flex-1 bg-gray-50 p-5">
        {selectedConversation ? (
          <>
            <div className="h-full flex flex-col">
              {/* Messages Display */}
              <div className="flex-1 overflow-y-auto p-3">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-600">No messages yet</div>
                ) : (
                  <div>
                    {messages.map((msg, index) => (
                      <div
                        key={index}
                        className={`flex ${msg.senderId === user.uid ? "justify-end" : "justify-start"} mb-4`}
                      >
                        <div
                          className={`p-3 rounded-xl max-w-xs ${
                            msg.senderId === user.uid
                              ? "bg-olive-dark text-white"
                              : "bg-gray-300 text-gray-800"
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="flex items-center border-t pt-3">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  placeholder="Type a message..."
                />
                <button
                  onClick={handleSendMessage}
                  className="ml-3 p-3 bg-olive-dark text-white rounded-lg hover:opacity-80"
                >
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center text-gray-600">Select a conversation to view messages</div>
        )}
      </div>
    </div>
  );
};

export default GuestMessages;

import React, { useState, useEffect, useRef } from "react";
import {
  doc,
  getDocs,
  collection,
  addDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

const GuestMessages = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState([]);
  const [user, setUser] = useState(null);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const navigate = useNavigate();
  const messagesEndRef = useRef(null); // 👈 for auto-scroll

  // ✅ Scroll to bottom smoothly whenever messages update
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ✅ Wait for user authentication before fetching chats
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        await fetchConversations(currentUser);
      }

      setLoadingConversations(false);
    });

    return () => unsubscribe();
  }, []);

  // ✅ Fetch all conversations involving the current user
  const fetchConversations = async (currentUser) => {
    const conversationsRef = collection(db, "chats");
    const snapshot = await getDocs(conversationsRef);
    const userConversations = [];

    for (const chatDoc of snapshot.docs) {
      const chatData = chatDoc.data();

      if (chatData.participants.includes(currentUser.uid)) {
        const hostId = chatData.participants.find(
          (id) => id !== currentUser.uid
        );

        let hostName = "Unknown User";
        let hostPic = null;

        if (hostId) {
          const hostRef = doc(db, "users", hostId);
          const hostSnap = await getDoc(hostRef);
          if (hostSnap.exists()) {
            const hostData = hostSnap.data();
            hostName = hostData.name || hostData.fullName || "Unnamed User";
            hostPic = hostData.profilePic || null;
          }
        }

        userConversations.push({
          id: chatDoc.id,
          hostName,
          hostPic,
          ...chatData,
        });
      }
    }

    // Sort by most recently updated
    userConversations.sort(
      (a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
    );

    setConversations(userConversations);
  };

  // 🟢 Realtime listener for messages
  useEffect(() => {
    if (!selectedConversation?.id) return;

    const chatRef = doc(db, "chats", selectedConversation.id);
    const messagesRef = collection(chatRef, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatMessages = snapshot.docs.map((doc) => doc.data());
      setMessages(chatMessages);
    });

    return () => unsubscribe();
  }, [selectedConversation]);

  // 🟢 Send message (via button or Enter key)
  const handleSendMessage = async () => {
    if (messageText.trim() === "" || !selectedConversation) return;

    try {
      const chatRef = doc(db, "chats", selectedConversation.id);
      const newMessage = {
        senderId: user.uid,
        text: messageText,
        createdAt: new Date(),
      };

      await addDoc(collection(chatRef, "messages"), newMessage);

      await updateDoc(chatRef, {
        lastMessage: messageText,
        updatedAt: new Date(),
      });

      setMessageText("");
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  // ✅ Send message when pressing Enter
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatDate = (date) => {
    const validDate = new Date(date);
    return isNaN(validDate) ? null : format(validDate, "MMM dd, yyyy");
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left Panel */}
      <div className="w-1/3 bg-white shadow-lg flex flex-col">
        <div className="p-5 border-b">
          {/* 🔙 Back Button */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center text-olive-dark hover:text-olive font-medium mb-2 transition"
          >
            ← Back
          </button>

          <h2 className="text-xl font-semibold text-olive-dark">
            Conversations
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loadingConversations ? (
            <p className="text-gray-500 text-center">Loading conversations...</p>
          ) : conversations.length === 0 ? (
            <p className="text-gray-500 text-center">No conversations found</p>
          ) : (
            <ul>
              {conversations.map((conversation) => (
                <li
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation)}
                  className={`flex items-center p-4 hover:bg-gray-100 cursor-pointer rounded-xl transition ${selectedConversation?.id === conversation.id
                      ? "bg-gray-100"
                      : ""
                    }`}
                >
                  {conversation.hostPic ? (
                    <img
                      src={conversation.hostPic}
                      alt={conversation.hostName}
                      className="w-12 h-12 rounded-full mr-4 object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-300 rounded-full mr-4 flex items-center justify-center text-gray-600">
                      {conversation.hostName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-800">
                      {conversation.hostName}
                    </p>
                    <p className="text-gray-600 text-sm truncate max-w-[180px]">
                      {conversation.lastMessage || "No messages yet"}
                    </p>
                    <span className="text-gray-400 text-xs">
                      {conversation.updatedAt
                        ? formatDate(conversation.updatedAt)
                        : "No date"}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 bg-gray-50 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Header */}
            <div className="border-b p-5">
              <h3 className="text-lg font-semibold text-olive-dark">
                Chat with {selectedConversation.hostName}
              </h3>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-5">
              {messages.length === 0 ? (
                <div className="text-center text-gray-600">No messages yet</div>
              ) : (
                messages.map((msg, index) => {
                  const messageTime = msg.createdAt
                    ? format(
                      msg.createdAt.toDate
                        ? msg.createdAt.toDate()
                        : msg.createdAt,
                      "h:mm a"
                    )
                    : "";

                  const isUser = msg.senderId === user?.uid;

                  return (
                    <div
                      key={index}
                      className={`flex ${isUser ? "justify-end" : "justify-start"
                        } mb-4`}
                    >
                      <div>
                        <div
                          className={`p-3 rounded-xl max-w-xs ${isUser
                              ? "bg-olive-dark text-white"
                              : "bg-gray-300 text-gray-800"
                            }`}
                        >
                          {msg.text}
                        </div>
                        <div
                          className={`text-xs mt-1 text-gray-500 ${isUser ? "text-right pr-1" : "text-left pl-1"
                            }`}
                        >
                          {messageTime}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} /> {/* 👈 auto-scroll target */}
            </div>

            {/* Input */}
            <div className="border-t p-4 flex items-center">
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={handleKeyPress}
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
          </>
        ) : (
          <div className="flex items-center justify-center flex-1 text-gray-600">
            Select a conversation to view messages
          </div>
        )}
      </div>
    </div>
  );

};

export default GuestMessages;

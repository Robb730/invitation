import React, { useEffect, useState, useRef } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { db, auth } from "../../../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { format } from "date-fns";

const HostMessages = () => {
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(true);
  const messagesEndRef = useRef(null);

  // 🔐 Track logged-in host
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // 💬 Fetch conversations where this host is a participant
  useEffect(() => {
    const fetchConversations = async () => {
      if (!user) return;

      try {
        const chatsRef = collection(db, "chats");
        const q = query(chatsRef, where("participants", "array-contains", user.uid));
        const querySnapshot = await getDocs(q);

        const fetchedConversations = await Promise.all(
          querySnapshot.docs.map(async (docSnap) => {
            const chatData = docSnap.data();

            // Find the guest (the other participant)
            const guestId = chatData.participants.find((id) => id !== user.uid);

            // Fetch guest info
            const guestDoc = await getDoc(doc(db, "users", guestId));
            const guestData = guestDoc.exists() ? guestDoc.data() : {};

            return {
              id: docSnap.id,
              ...chatData,
              guestId,
              guestName: guestData.fullName || "Guest",
              guestPic: guestData.profilePic || null,
              updatedAt: chatData.updatedAt?.toDate() || null,
            };
          })
        );

        setConversations(fetchedConversations);
      } catch (error) {
        console.error("Error fetching conversations:", error);
      } finally {
        setLoadingConversations(false);
      }
    };

    fetchConversations();
  }, [user]);

  // 📩 Fetch messages for selected chat
  useEffect(() => {
    if (!selectedConversation) return;

    const messagesRef = collection(db, "chats", selectedConversation.id, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [selectedConversation]);

  // 🕐 Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

   const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // ✉️ Send message (only once)
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return;

    try {
      const messageRef = collection(db, "chats", selectedConversation.id, "messages");

      await addDoc(messageRef, {
        text: newMessage,
        senderId: user.uid,
        createdAt: serverTimestamp(),
      });

      // update chat info
      const chatDocRef = doc(db, "chats", selectedConversation.id);
      await updateDoc(chatDocRef, {
        updatedAt: serverTimestamp(),
        lastMessage: newMessage,
      });

      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };


  return (
    <div className="flex bg-white rounded-2xl shadow-md h-[75vh] overflow-hidden">
      {/* 🧭 Left Panel */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold text-olive-dark">Conversations</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
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
                  className={`flex items-center p-3 hover:bg-gray-100 cursor-pointer rounded-xl transition ${
                    selectedConversation?.id === conversation.id ? "bg-gray-100" : ""
                  }`}
                >
                  {conversation.guestPic ? (
                    <img
                      src={conversation.guestPic}
                      alt={conversation.guestName}
                      className="w-10 h-10 rounded-full mr-3 object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-300 rounded-full mr-3 flex items-center justify-center text-gray-600">
                      {conversation.guestName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800 truncate">
                      {conversation.guestName}
                    </p>
                    <p className="text-gray-600 text-sm truncate max-w-[180px]">
                      {conversation.lastMessage || "No messages yet"}
                    </p>
                    <span className="text-gray-400 text-xs">
                      {conversation.updatedAt
                        ? format(conversation.updatedAt, "MMM d, h:mm a")
                        : ""}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* 💬 Chat Panel */}
      <div className="w-2/3 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Header */}
            <div className="flex items-center border-b p-4">
              {selectedConversation.guestPic ? (
                <img
                  src={selectedConversation.guestPic}
                  alt={selectedConversation.guestName}
                  className="w-10 h-10 rounded-full mr-3 object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-gray-300 rounded-full mr-3 flex items-center justify-center text-gray-600">
                  {selectedConversation.guestName.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  {selectedConversation.guestName}
                </h3>
                <p className="text-sm text-gray-500">Guest</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
              {messages.length === 0 ? (
                <div className="text-center text-gray-600 mt-10">
                  No messages yet
                </div>
              ) : (
                messages.map((msg) => {
                  const isUser = msg.senderId === user?.uid;
                  const time = msg.createdAt?.toDate
                    ? format(msg.createdAt.toDate(), "h:mm a")
                    : "";

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                    >
                      <div>
                        <div
                          className={`p-3 rounded-xl max-w-xs break-words ${
                            isUser
                              ? "bg-olive-dark text-white"
                              : "bg-gray-200 text-gray-800"
                          }`}
                        >
                          {msg.text}
                        </div>
                        <div
                          className={`text-xs mt-1 text-gray-500 ${
                            isUser ? "text-right pr-1" : "text-left pl-1"
                          }`}
                        >
                          {time}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Box */}
            <div className="border-t p-4 flex items-center bg-white">
              <input
                type="text"
                placeholder="Type your message..."
                value={newMessage}
                onKeyDown={handleKeyPress}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-olive-light"
              />
              <button
                onClick={handleSendMessage}
                className="ml-3 bg-olive-dark text-white px-5 py-3 rounded-xl hover:bg-olive transition"
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a conversation to start chatting.
          </div>
        )}
      </div>
    </div>
  );
};

export default HostMessages;

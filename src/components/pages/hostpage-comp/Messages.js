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
        const q = query(
          chatsRef,
          where("participants", "array-contains", user.uid)
        );
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

    const messagesRef = collection(
      db,
      "chats",
      selectedConversation.id,
      "messages"
    );
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
      const messageRef = collection(
        db,
        "chats",
        selectedConversation.id,
        "messages"
      );

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
  <div className="flex rounded-3xl h-[85vh] sm:h-[90vh] md:h-[32rem] overflow-hidden">

    {/* 🧭 Left Panel - Conversations List */}
    <div
      className={`w-full md:w-1/3 border-r border-gray-200/50 flex flex-col bg-white/50 backdrop-blur-sm transition-all duration-300 ${
        selectedConversation ? "hidden md:flex" : "flex"
      }`}
    >
      {/* LEFT PANEL CONTENT (unchanged) */}
      <div className="p-4 md:p-6 border-b border-gray-200/50 bg-gradient-to-r from-white to-white">
        <div className="flex items-center justify-between mb-1 md:mb-2">
          <h2 className="text-xl md:text-2xl font-bold text-olive-dark">Messages</h2>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        </div>
        <p className="text-xs md:text-sm text-gray-600">{conversations.length} active conversations</p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-2 bg-white">
        {loadingConversations ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 border-2 border-olive-dark/30 border-t-olive-dark rounded-full animate-spin"></div>
            <p className="text-gray-500 font-medium text-sm md:text-base">Loading conversations...</p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-4">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-6 h-6 md:w-8 md:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-gray-600 font-medium">No conversations yet</p>
            <p className="text-sm text-gray-400 mt-1">Start chatting with your guests</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {conversations.map((conversation, index) => (
              <li
                key={conversation.id}
                onClick={() => setSelectedConversation(conversation)}
                style={{ animationDelay: `${index * 50}ms` }}
                className={`flex items-center p-3 md:p-4 cursor-pointer rounded-2xl transition-all duration-200 animate-fadeIn ${
                  selectedConversation?.id === conversation.id
                    ? "bg-gradient-to-r from-olive-dark/10 to-olive-dark/5 shadow-md border-2 border-olive-dark/20"
                    : "hover:bg-gray-50 border-2 border-transparent"
                }`}
              >
                {conversation.guestPic ? (
                  <img src={conversation.guestPic} alt={conversation.guestName} className="w-10 h-10 md:w-12 md:h-12 rounded-full mr-3 object-cover ring-2 ring-white shadow-sm" />
                ) : (
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-olive-dark/20 to-olive-dark/10 rounded-full mr-3 flex items-center justify-center text-olive-dark font-bold text-base md:text-lg ring-2 ring-white shadow-sm">
                    {conversation.guestName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5 md:mb-1">
                    <p className="font-semibold text-gray-800 truncate text-sm md:text-base">
                      {conversation.guestName}
                    </p>
                    <span className="text-[10px] md:text-xs text-gray-400 font-medium ml-2 shrink-0">
                      {conversation.updatedAt ? format(conversation.updatedAt, "MMM d") : ""}
                    </span>
                  </div>
                  <p className="text-gray-600 text-xs md:text-sm truncate">
                    {conversation.lastMessage || "No messages yet"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>

    {/* 💬 Chat Panel */}
    <div
  className={`
    relative w-full md:w-2/3 flex flex-col bg-white 
    transition-all duration-300
    h-[85vh] md:h-auto
    ${selectedConversation ? "flex rounded-none md:rounded-3xl" : "hidden md:flex"}
  `}
>

      {selectedConversation ? (
        <>
          {/* Header */}
          <div className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-200/50 p-4 md:p-6 bg-gradient-to-r from-white to-gray-50/50 backdrop-blur-sm">
            <div className="flex items-center gap-3 md:gap-4">
              <button className="md:hidden p-2 -ml-2 text-gray-600 hover:text-olive-dark" onClick={() => setSelectedConversation(null)}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {selectedConversation.guestPic ? (
                <img src={selectedConversation.guestPic} alt={selectedConversation.guestName} className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover ring-2 ring-olive-dark/20 shadow-md" />
              ) : (
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-olive-dark/20 to-olive-dark/10 rounded-full flex items-center justify-center text-olive-dark font-bold text-base md:text-lg ring-2 ring-olive-dark/20 shadow-md">
                  {selectedConversation.guestName.charAt(0).toUpperCase()}
                </div>
              )}

              <h3 className="text-base md:text-lg font-bold text-gray-800">{selectedConversation.guestName}</h3>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-gradient-to-b from-gray-50/30 to-white pt-20 md:pt-6">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-olive-dark/10 to-olive-dark/5 flex items-center justify-center">
                  <svg className="w-8 h-8 md:w-10 md:h-10 text-olive-dark/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-gray-600 font-semibold text-base md:text-lg">Start the conversation</p>
                <p className="text-sm text-gray-400 mt-1">Send a message to {selectedConversation.guestName}</p>
              </div>
            ) : (
              messages.map((msg, index) => {
                const isUser = msg.senderId === user?.uid;
                const time = msg.createdAt?.toDate ? format(msg.createdAt.toDate(), "h:mm a") : "";

                return (
                  <div
                    key={msg.id}
                    style={{ animationDelay: `${index * 30}ms` }}
                    className={`flex ${isUser ? "justify-end" : "justify-start"} animate-fadeIn`}
                  >
                    <div className={`flex ${isUser ? "flex-row-reverse" : "flex-row"} items-end gap-2 max-w-[80%]`}>
                      {!isUser && (
                        <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-100 flex items-center justify-center text-gray-600 text-[10px] md:text-xs font-bold shrink-0">
                          {selectedConversation.guestName.charAt(0).toUpperCase()}
                        </div>
                      )}

                      <div>
                        <div
                          className={`p-3 md:p-4 rounded-2xl shadow-sm ${
                            isUser
                              ? "bg-gradient-to-r from-olive-dark to-olive-dark/90 text-white rounded-br-sm"
                              : "bg-white text-gray-800 border border-gray-200 rounded-bl-sm"
                          }`}
                        >
                          <p className="text-sm leading-relaxed break-words">{msg.text}</p>
                        </div>
                        <div className={`text-[10px] md:text-xs mt-1 text-gray-400 font-medium ${isUser ? "text-right pr-1" : "text-left pl-1"}`}>
                          {time}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <div className="border-t border-gray-200/50 p-3 md:p-6 md:rounded-b-3xl">
            <div className="flex items-end gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={newMessage}
                  onKeyDown={handleKeyPress}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-2xl p-3 md:p-4 pr-10 md:pr-12 focus:outline-none focus:ring-2 focus:ring-olive-dark/20 focus:border-olive-dark transition-all duration-200 bg-gray-50 hover:bg-white text-sm md:text-base"
                />
                <button className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <svg className="w-4 h-4 md:w-5 md:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </div>

              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className="bg-gradient-to-r from-olive-dark to-olive-dark/90 text-white px-4 md:px-6 py-3 md:py-4 rounded-2xl hover:shadow-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 font-semibold flex items-center gap-1.5 md:gap-2 shrink-0 text-sm md:text-base"
              >
                <span>Send</span>
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-olive-dark/10 to-olive-dark/5 flex items-center justify-center mb-6">
            <svg className="w-10 h-10 md:w-12 md:h-12 text-olive-dark/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-2">No Conversation Selected</h3>
          <p className="text-gray-500 max-w-sm text-sm md:text-base">Choose a conversation from the list to start messaging with your guests</p>
        </div>
      )}
    </div>

    {/* Animation styles */}
    <style jsx>{`
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .animate-fadeIn {
        animation: fadeIn 0.3s ease-out forwards;
      }
    `}</style>
  </div>
);
};

export default HostMessages;

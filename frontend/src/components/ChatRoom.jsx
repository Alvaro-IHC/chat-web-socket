import React, { useEffect, useState } from "react";
import SockJS from "sockjs-client";
import { over } from "stompjs";

let stompClient = null;
const ChatRoom = () => {
  const [publicChats, setPublicChats] = useState([]);
  const [privateChats, setPrivateChats] = useState(new Map());
  const [tab, setTab] = useState("CHATROOM");
  const [userData, setUserData] = useState({
    username: "",
    receivername: "",
    connected: false,
    message: "",
  });

  useEffect(() => {
    console.log(userData);
  }, [userData]);

  const handleValue = (event) => {
    const { name, value } = event.target;
    setUserData({ ...userData, [name]: value });
  };

  const registerUser = () => {
    let sock = new SockJS("http://localhost:8080/ws");
    stompClient = over(sock);
    stompClient.connect({}, onConnected, onError);
    console.log(">>>>>>>>> 1");
  };

  const onConnected = () => {
    setUserData({
      ...userData,
      connected: true,
    });
    stompClient.subscribe("/chatroom/public", onPublicMessageReceived);
    stompClient.subscribe(
      `/user/${userData.username}/private`,
      onPrivateMessageReceived
    );
    stompClient.stompClient.subscribe("/my/endpoint", onMyEndpointReceived);
    console.log(">>>>>>>>> 2");
    userJoin();
  };

  const onMyEndpointReceived = (payload) => {
    console.log(payload);
  };

  const userJoin = () => {
    let chatMessage = {
      senderName: userData.username,
      status: "JOIN",
    };
    stompClient.send("/app/message", {}, JSON.stringify(chatMessage));
    console.log(">>>>>>>>> 3");
  };

  const onError = (error) => {
    console.log(error);
  };

  const onPublicMessageReceived = (payload) => {
    let payloadData = JSON.parse(payload.body);
    // eslint-disable-next-line default-case
    switch (payloadData.status) {
      case "JOIN":
        if (!privateChats.get(payloadData.senderName)) {
          privateChats.set(payloadData.senderName, []);
          setPrivateChats(new Map(privateChats));
        }
        break;
      case "MESSAGE":
        publicChats.push(payloadData);
        setPublicChats([...publicChats]);
        break;
    }
  };

  const onPrivateMessageReceived = (payload) => {
    console.log("private message received");
    let payloadData = JSON.parse(payload.body);
    if (privateChats.get(payloadData.senderName)) {
      privateChats.get(payloadData.senderName).push(payloadData);
      setPrivateChats(new Map(privateChats));
    } else {
      let list = [];
      list.push(payloadData);
      privateChats.set(payloadData.senderName, list);
      setPrivateChats(new Map(privateChats));
    }
  };

  const sendPublicMessage = () => {
    if (stompClient) {
      let chatMessage = {
        senderName: userData.username,
        message: userData.message,
        status: "MESSAGE",
      };
      stompClient.send("/app/message", {}, JSON.stringify(chatMessage));
      setUserData({ ...userData, message: "" });
    }
  };

  const sendPrivateMessage = () => {
    console.log("Hiiiiiii");
    if (stompClient) {
      console.log("Hiiiiiii+++++");
      let chatMessage = {
        senderName: userData.username,
        receiverName: tab,
        message: userData.message,
        status: "MESSAGE",
      };
      if (userData.username !== tab) {
        privateChats.get(tab).push(chatMessage);
        setPrivateChats(new Map(privateChats));
      }
      stompClient.send("/app/private-message", {}, JSON.stringify(chatMessage));
      setUserData({ ...userData, message: "" });
    }
  };

  return (
    <div className='container'>
      {userData.connected ? (
        <div className='chat-box'>
          <div className='member-list'>
            <ul>
              <li
                onClick={() => {
                  setTab("CHATROOM");
                }}
                className={`member ${tab === "CHATROOM" && "active"}`}
              >
                Chatroom
              </li>
              {[...privateChats.keys()].map((name, index) => (
                <li
                  className={`member ${tab === name && "active"}`}
                  key={index}
                  onClick={() => {
                    setTab(name);
                  }}
                >
                  {name}
                </li>
              ))}
            </ul>
          </div>

          {tab === "CHATROOM" && (
            <div className='chat-content'>
              <ul className='chat-messages'>
                {publicChats.map((chat, index) => (
                  <li className='message' key={index}>
                    {chat.senderName !== userData.username && (
                      <div className='avatar'>{chat.senderName}</div>
                    )}
                    <div className='message-data'>{chat.message}</div>
                    {chat.senderName === userData.username && (
                      <div className='avatar self'>{chat.senderName}</div>
                    )}
                  </li>
                ))}
              </ul>
              <div className='send-message'>
                <input
                  type='text'
                  className='input-message'
                  placeholder='Enter public message'
                  value={userData.message}
                  name='message'
                  onChange={handleValue}
                />
                <button
                  className='send-button'
                  type='button'
                  onClick={sendPublicMessage}
                >
                  Send
                </button>
              </div>
            </div>
          )}

          {tab !== "CHATROOM" && (
            <div className='chat-content'>
              <ul className='chat-messages'>
                {[...privateChats.get(tab)].map((chat, index) => (
                  <li className='message' key={index}>
                    {chat.senderName !== userData.username && (
                      <div className='avatar'>{chat.senderName}</div>
                    )}
                    <div className='message-data'>{chat.message}</div>
                    {chat.senderName === userData.username && (
                      <div className='avatar self'>{chat.senderName}</div>
                    )}
                  </li>
                ))}
              </ul>
              <div className='send-message'>
                <input
                  type='text'
                  className='input-message'
                  placeholder={`Enter private message for ${tab}`}
                  value={userData.message}
                  name='message'
                  onChange={handleValue}
                />
                <button
                  className='send-button'
                  type='button'
                  onClick={sendPrivateMessage}
                >
                  Send
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className='register'>
          <input
            id='user-name'
            placeholder='Enter your username'
            value={userData.username}
            name='username'
            onChange={handleValue}
          />
          <button type='button' onClick={registerUser}>
            Connect
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatRoom;

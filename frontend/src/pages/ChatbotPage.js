import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import styled, { keyframes } from "styled-components";
import { FaPaperPlane } from "react-icons/fa";

// Animations
const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`;

const bubbleAppear = keyframes`
  0% { opacity: 0; transform: scale(0.5); }
  100% { opacity: 1; transform: scale(1); }
`;

const drinkCoffee = keyframes`
  0% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-5px) rotate(-5deg); }
  50% { transform: translateY(-10px) rotate(0deg); }
  75% { transform: translateY(-5px) rotate(5deg); }
  100% { transform: translateY(0) rotate(0deg); }
`;

// Styled components
const ChatContainer = styled.div`
  max-width: 500px;
  margin: 2rem auto;
  background: #f9f3e9;
  border-radius: 20px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  font-family: 'Open Sans', sans-serif;
  position: relative;
  background-image: url('https://transparenttextures.com/patterns/coffee.png');
  background-blend-mode: overlay;
`;

const ChatHeader = styled.div`
  background: #5d4037;
  color: white;
  padding: 1.5rem;
  text-align: center;
  position: relative;

  h2 {
    margin: 0;
    font-size: 1.5rem;
  }
`;

const MessagesContainer = styled.div`
  height: 400px;
  padding: 1.5rem;
  overflow-y: auto;
  background-color: rgba(239, 235, 233, 0.85);
  position: relative;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: url('https://www.transparenttextures.com/patterns/coffee-cup.png');
    opacity: 0.1;
    z-index: 0;
  }
`;

const Message = styled.div`
  margin-bottom: 1rem;
  animation: ${bubbleAppear} 0.3s ease-out;
  max-width: 80%;
  position: relative;
  z-index: 1;

  &.user {
    margin-left: auto;
    background: #5d4037;
    color: white;
    border-radius: 15px 15px 0 15px;
    padding: 0.8rem 1.2rem;
  }

  &.bot {
    margin-right: auto;
    background: white;
    color: #5d4037;
    border-radius: 15px 15px 15px 0;
    padding: 0.8rem 1.2rem;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  }
`;

const InputArea = styled.div`
  padding: 1rem;
  background: white;
  border-top: 1px solid #d7ccc8;
  position: relative;
`;

const InputForm = styled.form`
  display: flex;
  align-items: center;

  input {
    flex: 1;
    padding: 0.8rem;
    border: 1px solid #d7ccc8;
    border-radius: 25px;
    outline: none;
    font-size: 1rem;

    &:focus {
      border-color: #8d6e63;
    }
  }

  button {
    background: #8d6e63;
    color: white;
    border: none;
    border-radius: 50%;
    width: 50px;
    height: 50px;
    margin-left: 0.5rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s;

    &:hover {
      background: #5d4037;
      transform: scale(1.05);
    }

    &:active {
      transform: scale(0.95);
    }
  }
`;

const LoadingDots = styled.div`
  display: flex;
  justify-content: center;
  padding: 1rem;

  div {
    width: 10px;
    height: 10px;
    margin: 0 3px;
    background: #8d6e63;
    border-radius: 50%;
    animation: ${bubbleAppear} 0.6s infinite alternate;

    &:nth-child(2) {
      animation-delay: 0.2s;
    }

    &:nth-child(3) {
      animation-delay: 0.4s;
    }
  }
`;

const RobotMessage = styled.div`
  position: absolute;
  right: 100px;
  top: -30px;
  background: white;
  color: #5d4037;
  border-radius: 15px 15px 15px 0;
  padding: 0.5rem 0.8rem;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  font-size: 0.8rem;
  max-width: 150px;
  animation: ${bubbleAppear} 0.3s ease-out;
`;

const RobotContainer = styled.div`
  position: absolute;
  right: 20px;
  top: -60px;
  animation: ${drinkCoffee} 2s ease-in-out infinite;
  width: 60px;
  height: 80px;
`;

const Robot = styled.div`
  width: 100%;
  height: 100%;
  position: relative;

  &::before {
    content: "";
    position: absolute;
    width: 40px;
    height: 50px;
    background: #8d6e63;
    border-radius: 50% 50% 0 0;
    top: 0;
    left: 10px;
  }

  &::after {
    content: "";
    position: absolute;
    width: 25px;
    height: 25px;
    background: #5d4037;
    border-radius: 50%;
    top: 25px;
    left: 18px;
  }
`;

const CoffeeCup = styled.div`
  position: absolute;
  width: 25px;
  height: 15px;
  background: #6d4c41;
  border-radius: 0 0 50% 50%;
  bottom: 0;
  left: 18px;

  &::before {
    content: "";
    position: absolute;
    width: 8px;
    height: 12px;
    background: #d7ccc8;
    border-radius: 0 5px 5px 0;
    right: -8px;
    top: 4px;
  }

  &::after {
    content: "";
    position: absolute;
    width: 15px;
    height: 8px;
    background: #8d6e63;
    border-radius: 5px;
    top: -8px;
    left: 5px;
  }
`;

function ChatbotPage() {
  const [messages, setMessages] = useState([
    { text: "Hello! Welcome to our coffee shop. How are you feeling today?", sender: "bot" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleChat = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { text: input, sender: "user" };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await axios.post("http://localhost:8000/api/chatbot", {
        message: input,
      });

      setMessages(prev => [...prev, { text: res.data.suggestion, sender: "bot" }]);
    } catch (error) {
      console.error("Error talking to chatbot:", error);
      setMessages(prev => [...prev, { 
        text: "Sorry, something went wrong. Please try again.", 
        sender: "bot" 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ChatContainer>
      <ChatHeader>
        <h2>Coffee Shop Chat</h2>
      </ChatHeader>

      <MessagesContainer>
        {messages.map((msg, index) => (
          <Message key={index} className={msg.sender}>
            {msg.text}
          </Message>
        ))}

        {isLoading && (
          <Message className="bot">
            <LoadingDots>
              <div></div>
              <div></div>
              <div></div>
            </LoadingDots>
          </Message>
        )}

        <div ref={messagesEndRef} />
      </MessagesContainer>

      <InputArea>
        <RobotContainer>
          <Robot>
            <CoffeeCup />
          </Robot>
        </RobotContainer>
        <RobotMessage>Ask me anything!</RobotMessage>

        <InputForm onSubmit={handleChat}>
          <input
            type="text"
            placeholder="How are you feeling?"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit">
            <FaPaperPlane size={18} />
          </button>
        </InputForm>
      </InputArea>
    </ChatContainer>
  );
}

export default ChatbotPage;
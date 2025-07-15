import React, { useState, useRef } from "react";
import "./AssistantPanel.css";

// PUBLIC_INTERFACE
function AssistantPanel({ open, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I'm the Tic Tac Toe Assistant 🤖. Ask me for hints, rules, or strategies, or just chat about the game!",
    },
  ]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef(null);

  const REACT_APP_OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;

  // PUBLIC_INTERFACE
  async function sendMessage(e) {
    e.preventDefault();
    if (!userInput.trim()) return;

    const updatedMessages = [
      ...messages,
      { role: "user", content: userInput.trim() },
    ];
    setMessages(updatedMessages);
    setIsLoading(true);
    setError("");
    setUserInput("");

    try {
      const apiKey =
        REACT_APP_OPENAI_API_KEY ||
        window.env &&
        window.env.REACT_APP_OPENAI_API_KEY;

      // Use o3-mini as the OpenAI model
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "o3-mini",
          messages: [
            {
              role: "system",
              content:
                "You are an assistant for a simple, web Tic Tac Toe game. Your job is to give friendly, helpful, and concise answers to game-related questions, provide legal move hints, explain strategies or rules, and converse about gameplay. Stay positive and clear. This is a modern minimalistic app.",
            },
            ...updatedMessages.slice(-6), // last 6 messages to limit context
          ],
          max_tokens: 200,
          temperature: 0.5,
        }),
      });

      if (!response.ok) {
        throw new Error("OpenAI API error.");
      }
      const data = await response.json();
      const aiReply = data.choices?.[0]?.message?.content?.trim() || "Sorry, I couldn't answer that.";
      setMessages((msgs) => [
        ...msgs,
        { role: "assistant", content: aiReply },
      ]);
    } catch (err) {
      setError(
        "Sorry, there was a problem reaching the assistant. Please check your internet connection and API key."
      );
      setMessages((msgs) => [
        ...msgs,
        {
          role: "assistant",
          content:
            "Oops! I couldn't get a response from OpenAI. Please try again in a moment.",
        },
      ]);
    }
    setIsLoading(false);
    setTimeout(
      () => scrollRef.current && scrollRef.current.scrollIntoView({ behavior: "smooth" }),
      100
    );
  }

  return (
    <div className={`assistant-panel${open ? " open" : ""}`}>
      <div className="assistant-header">
        <span role="img" aria-label="Assistant">
          🤖
        </span>{" "}
        Game Assistant
        <button
          aria-label="Close assistant"
          onClick={onClose}
          className="assistant-close"
          tabIndex={0}
        >
          ✖
        </button>
      </div>
      <div className="assistant-messages">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`assistant-msg ${msg.role === "user" ? "user" : "assistant"}`}
          >
            <div className="assistant-bubble">{msg.content}</div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>
      <form className="assistant-input-row" onSubmit={sendMessage}>
        <input
          className="assistant-input"
          type="text"
          autoComplete="off"
          placeholder="Type your question, e.g. 'Give me a move hint!'"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          disabled={isLoading}
          aria-label="Ask the game assistant"
        />
        <button
          className="assistant-send"
          type="submit"
          disabled={!userInput.trim() || isLoading}
        >
          {isLoading ? "..." : "Send"}
        </button>
      </form>
      {error && <div className="assistant-error">{error}</div>}
      <div className="assistant-tip">
        Try: <span className="assistant-tip-highlight">"What is the best move?"</span> or{" "}
        <span className="assistant-tip-highlight">"Explain the rules."</span>
      </div>
    </div>
  );
}

export default AssistantPanel;

import { ChatBox, BtnWithIcon } from '@/styles/pnl.styles';
import { Box, Button, useMediaQuery } from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import Tooltip from './ui/Tooltip';
import { intelayerColors } from '@/styles/theme';

interface MessageProps {
  author: string;
  message: string;
}

const messagesData: MessageProps[] = [
  {
    author: 'receiver',
    message: 'Hey, did you see the latest earnings report?',
  },
  {
    author: 'receiver',
    message: 'Yes, it looks promising. The stock might go up.',
  },
  {
    author: 'receiver',
    message: "I'm thinking of buying some shares today.",
  },
  {
    author: 'receiver',
    message: 'Good idea. The market seems bullish.',
  },
  {
    author: 'sender',
    message: "What's your take on the current market trends?",
  },
  {
    author: 'receiver',
    message: "I believe it's a good time to invest in tech stocks.",
  },
  {
    author: 'receiver',
    message: "I'm considering shorting this stock, what do you think?",
  },
  {
    author: 'receiver',
    message: 'Be careful, it might rebound unexpectedly.',
  },
];

const ChatComponent = () => {
  const chatMessagesRef = useRef<HTMLElement | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<MessageProps[]>(messagesData);
  const isCompact = useMediaQuery('(max-width:1200px)');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const scrollToBottom = () => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    // Scroll to bottom when a new message is received
    scrollToBottom();
  }, [messages]); // Add dependency on messages state

  useEffect(() => {
    if (!isCompact) {
      setDrawerOpen(true);
    } else {
      setDrawerOpen(false);
    }
  }, [isCompact]);

  const handleSendMessage = () => {
    if (inputMessage.trim() !== '') {
      // Check if input message is not empty
      const newMessage = { author: 'sender', message: inputMessage.trim() };
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      setInputMessage(''); // Clear input field after sending message
    }
  };

  useEffect(() => {
    const handleEnterPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSendMessage();
      }
    };
    window.addEventListener('keydown', handleEnterPress);

    return () => {
      window.removeEventListener('keydown', handleEnterPress);
    };
  }, [inputMessage]);

  const chatBody = (
    <ChatBox>
      <Box className="header_nav">
        <Tooltip content="New Chat connects you to Intelayer's assistant. Ask strategy questions or generate order instructions in plain language.">
          <header>New Chat</header>
        </Tooltip>
        <Tooltip content="New Chat connects you to Intelayer's assistant. Ask strategy questions or generate order instructions in plain language.">
          <BtnWithIcon
            onClick={() => {
              if (isCompact) {
                setDrawerOpen(false);
              }
            }}
            aria-label="Start new chat"
          >
            <img src="/newChatIcon.svg" alt="new chat" />
          </BtnWithIcon>
        </Tooltip>
      </Box>
      <Box className="chat_room">
        <Box className="chat_messages" ref={chatMessagesRef}>
          {messages.map((message, index: number) => (
            <Box
              key={index}
              className={
                message.author === 'sender' ? 'send_bubble' : 'received_bubble'
              }
            >
              {message.message}
            </Box>
          ))}
        </Box>

        <Tooltip content="Type your question or trading instruction here. You can paste setups and ask the assistant to translate them into orders.">
          <Box className="chat_input">
            <input
              type="text"
              placeholder="Type here"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
            />
            <BtnWithIcon onClick={handleSendMessage} aria-label="Send message">
              <img src="/sendIcon.svg" alt="send" />
            </BtnWithIcon>
          </Box>
        </Tooltip>
      </Box>
    </ChatBox>
  );

  if (isCompact) {
    return (
      <>
        {!drawerOpen && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              alignItems: 'flex-start',
            }}
          >
            <Box sx={{ color: intelayerColors.muted, fontSize: '14px' }}>
              Need Intelayer's AI? Open the assistant to chat.
            </Box>
            <Button
              variant="contained"
              onClick={() => setDrawerOpen(true)}
              sx={{
                textTransform: 'none',
                backgroundColor: intelayerColors.green[600],
                '&:hover': { backgroundColor: intelayerColors.green[500] },
              }}
            >
              Launch Assistant
            </Button>
          </Box>
        )}

        {drawerOpen && (
          <Box
            sx={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(2, 4, 8, 0.7)',
              zIndex: 30,
              display: 'flex',
              justifyContent: 'flex-end',
            }}
          >
            <Box
              sx={{
                width: 'min(420px, 90vw)',
                height: '100%',
                backgroundColor: intelayerColors.surface,
                borderLeft: `1px solid ${intelayerColors.panelBorder}`,
                padding: '24px',
                overflow: 'hidden',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button
                  onClick={() => setDrawerOpen(false)}
                  sx={{
                    color: intelayerColors.muted,
                    textTransform: 'none',
                  }}
                >
                  Close
                </Button>
              </Box>
              {chatBody}
            </Box>
          </Box>
        )}
      </>
    );
  }

  return chatBody;
};

export default ChatComponent;

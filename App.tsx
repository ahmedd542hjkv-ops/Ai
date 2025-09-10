import React, { useState, useEffect, useMemo } from 'react';
import { streamResponse, generateImage, editImage } from './services/geminiService';
import { Settings, Conversation, Message, UploadedFile, SendMode } from './types';
import { FONTS, COLORS } from './constants';
import Sidebar from './components/Sidebar';
import ChatView from './components/ChatView';
import SettingsPanel from './components/SettingsPanel';
import Icon from './components/Icon';
import { ICONS } from './constants';

const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  colorTheme: COLORS[0],
  font: FONTS[0],
  fontSize: 16,
  systemPrompt: 'You are a helpful and friendly assistant. Your primary goal is to identify the language the user is writing in and respond exclusively in that same language. Do not switch languages unless the user does.',
  useSearch: false,
};

const App: React.FC = () => {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
        const savedSettings = localStorage.getItem('gemini-chat-settings');
        return savedSettings ? JSON.parse(savedSettings) : DEFAULT_SETTINGS;
    } catch (e) {
        console.error("Failed to parse settings from localStorage", e);
        return DEFAULT_SETTINGS;
    }
  });
  
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
        const savedConversations = localStorage.getItem('gemini-chat-conversations');
        return savedConversations ? JSON.parse(savedConversations) : [];
    } catch (e) {
        console.error("Failed to parse conversations from localStorage", e);
        return [];
    }
  });
  
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);

  // Apply theme and font styles
  useEffect(() => {
    document.documentElement.className = settings.theme;
    document.body.className = `${settings.colorTheme.bg} ${settings.colorTheme.text} ${settings.font.className}`;
    document.body.style.fontSize = `${settings.fontSize}px`;
  }, [settings]);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('gemini-chat-settings', JSON.stringify(settings));
  }, [settings]);

  // Save conversations to localStorage
  useEffect(() => {
    localStorage.setItem('gemini-chat-conversations', JSON.stringify(conversations));
  }, [conversations]);

  const currentConversation = useMemo(() => {
    return conversations.find(c => c.id === currentConversationId) || null;
  }, [conversations, currentConversationId]);

  const handleUpdateSettings = (newSettings: Settings) => {
    setSettings(newSettings);
  };

  const handleResetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem('gemini-chat-settings');
  };

  const handleNewConversation = () => {
    const newConversation: Conversation = {
      id: `conv-${Date.now()}`,
      title: 'New Conversation',
      messages: [],
      createdAt: new Date(),
    };
    setConversations(prev => [newConversation, ...prev]);
    setCurrentConversationId(newConversation.id);
  };

  const handleSelectConversation = (id: string) => {
    setCurrentConversationId(id);
    if (window.innerWidth <= 768) {
        setIsSidebarOpen(false);
    }
  };

  const handleDeleteConversation = (id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    if (currentConversationId === id) {
      const remainingConversations = conversations.filter(c => c.id !== id);
      setCurrentConversationId(remainingConversations.length > 0 ? remainingConversations[0].id : null);
    }
  };
  
  const handleDeleteMessage = (messageId: string) => {
    if (!currentConversationId) return;
    setConversations(prev => prev.map(c => {
        if (c.id === currentConversationId) {
            return {
                ...c,
                messages: c.messages.filter(m => m.id !== messageId)
            };
        }
        return c;
    }));
  };

  const handleEditImage = async (prompt: string, fileToEdit: UploadedFile) => {
    if (!currentConversation) return;
    const convId = currentConversation.id;

    // Add user's edit prompt message for context
    const userMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'user',
        text: prompt,
        files: [fileToEdit],
        timestamp: new Date(),
    };
    setConversations(prev => prev.map(c => c.id === convId ? { ...c, messages: [...c.messages, userMessage] } : c));
    setIsThinking(true);

    try {
        const { text, file } = await editImage(prompt, fileToEdit);
        const modelMessage: Message = {
            id: `msg-${Date.now()}-bot-edit`,
            role: 'model',
            text: text,
            files: [file],
            timestamp: new Date(),
        };
        setConversations(prev => prev.map(c => c.id === convId ? { ...c, messages: [...c.messages, modelMessage] } : c));
    } catch (error) {
        console.error("Error editing image:", error);
        const errorMessage = "Sorry, I couldn't edit that image. Please try again.";
        const errorBotMessage: Message = {
            id: `msg-${Date.now()}-bot-error`,
            role: 'model',
            text: errorMessage,
            timestamp: new Date(),
        };
        setConversations(prev => prev.map(c => c.id === convId ? { ...c, messages: [...c.messages, errorBotMessage] } : c));
    } finally {
        setIsThinking(false);
    }
};

    const handleSendMessage = async (text: string, files: UploadedFile[], sendMode: SendMode) => {
        let conversationToUpdate = currentConversation;
        let isNewConversation = false;
        
        if (!conversationToUpdate) {
            isNewConversation = true;
            const newConvId = `conv-${Date.now()}`;
            const newConversation: Conversation = {
              id: newConvId,
              title: text.substring(0, 30) || 'New Conversation',
              messages: [],
              createdAt: new Date(),
            };
            conversationToUpdate = newConversation;
            setCurrentConversationId(newConvId);
        }

        if (!conversationToUpdate) return;
        
        const history = conversationToUpdate.messages;
        const convId = conversationToUpdate.id;

        // For text-to-image, the user message shouldn't contain files.
        // For image-to-image, it should contain the source file.
        let filesForUserMessage = files;
        if (sendMode === 'image' && files.length === 0) {
            filesForUserMessage = [];
        }

        const userMessage: Message = {
            id: `msg-${Date.now()}`,
            role: 'user',
            text,
            files: filesForUserMessage,
            timestamp: new Date(),
        };
        
        const updateWithUserMessage = (convo: Conversation) => {
           return convo.id === convId ? { 
                ...convo, 
                messages: [...convo.messages, userMessage],
                title: convo.messages.length === 0 ? text.substring(0, 30) || 'New Conversation' : convo.title
            } : convo
        };
        
        if (isNewConversation) {
             setConversations(prev => [{ ...conversationToUpdate!, messages: [userMessage] }, ...prev]);
        } else {
            setConversations(prev => prev.map(updateWithUserMessage));
        }

        setIsThinking(true);
        
        try {
            if (sendMode === 'image') {
                if (files.length > 0 && files[0].type.startsWith('image/')) {
                    // Image-to-Image Generation
                    const { text: responseText, file: editedFile } = await editImage(text, files[0]);
                    const modelMessage: Message = {
                        id: `msg-${Date.now()}-bot-img-edit`,
                        role: 'model',
                        text: responseText,
                        files: [editedFile],
                        timestamp: new Date(),
                    };
                    setConversations(prev => prev.map(c => c.id === convId ? { ...c, messages: [...c.messages, modelMessage] } : c));

                } else {
                    // Text-to-Image Generation
                    const generatedFile = await generateImage(text);
                    const modelImageMessage: Message = {
                        id: `msg-${Date.now()}-bot-img`,
                        role: 'model',
                        text: '',
                        files: [generatedFile],
                        timestamp: new Date(),
                    };
                    setConversations(prev => prev.map(c => c.id === convId ? { ...c, messages: [...c.messages, modelImageMessage] } : c));
                }
            } else {
                 const modelMessage: Message = {
                    id: `msg-${Date.now()}-bot`,
                    role: 'model',
                    text: '',
                    timestamp: new Date(),
                    groundingChunks: [],
                };
                 setConversations(prev => prev.map(c => 
                    c.id === convId ? { ...c, messages: [...c.messages, modelMessage] } : c
                 ));
        
                const responseStream = await streamResponse(history, { text, files }, settings, sendMode);

                let streamedText = '';
                for await (const chunk of responseStream) {
                  streamedText += chunk.text;
                  const groundingChunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks || modelMessage.groundingChunks;

                  setConversations(prev => prev.map(c => 
                    c.id === convId ? {
                      ...c,
                      messages: c.messages.map(m => m.id === modelMessage.id ? { ...m, text: streamedText, groundingChunks } : m)
                    } : c
                  ));
                }
            }
        } catch (error) {
            console.error("Error processing message:", error);
            const errorMessage = "Sorry, something went wrong. Please try again.";
            const errorBotMessage: Message = {
                id: `msg-${Date.now()}-bot-error`,
                role: 'model',
                text: errorMessage,
                timestamp: new Date(),
            };
             setConversations(prev => prev.map(c => 
                c.id === convId ? { ...c, messages: [...c.messages, errorBotMessage] } : c
            ));
        } finally {
            setIsThinking(false);
        }
    };


  return (
    <div className="flex h-screen w-screen overflow-hidden">
        <Sidebar 
            conversations={conversations}
            currentConversationId={currentConversationId}
            onNewConversation={handleNewConversation}
            onSelectConversation={handleSelectConversation}
            onDeleteConversation={handleDeleteConversation}
            onOpenSettings={() => setIsSettingsOpen(true)}
            settings={settings}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
        />
        <main className="flex-1 flex flex-col relative">
           <button 
                onClick={() => setIsSidebarOpen(true)} 
                className={`md:hidden absolute top-4 left-4 z-20 p-2 rounded-full ${settings.colorTheme.secondary} ${settings.colorTheme.primaryContent}`}
            >
                <Icon svg={ICONS.menu} className="w-6 h-6"/>
            </button>
            <ChatView
                currentConversation={currentConversation}
                onSendMessage={handleSendMessage}
                onEditImage={handleEditImage}
                onDeleteMessage={handleDeleteMessage}
                isThinking={isThinking}
                settings={settings}
            />
        </main>
        <SettingsPanel
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onResetSettings={handleResetSettings}
        />
    </div>
  );
};

export default App;
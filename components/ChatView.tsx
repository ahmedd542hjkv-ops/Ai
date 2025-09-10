import React, { useState, useEffect, useRef } from 'react';
import { Conversation, Settings, UploadedFile, SendMode, Message as MessageType } from '../types';
import Message from './Message';
import ThinkingIndicator from './ThinkingIndicator';
import Icon from './Icon';
import { ICONS } from '../constants';
import ImageModal from './ImageModal';

interface ChatViewProps {
    currentConversation: Conversation | null;
    onSendMessage: (text: string, files: UploadedFile[], sendMode: SendMode) => void;
    onEditImage: (prompt: string, fileToEdit: UploadedFile) => void;
    onDeleteMessage: (messageId: string) => void;
    isThinking: boolean;
    settings: Settings;
}

const ChatView: React.FC<ChatViewProps> = ({
    currentConversation,
    onSendMessage,
    onEditImage,
    onDeleteMessage,
    isThinking,
    settings
}) => {
    const [prompt, setPrompt] = useState('');
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [isUploadMode, setIsUploadMode] = useState(false);
    const [editingFileId, setEditingFileId] = useState<string | null>(null);
    const [editingDescription, setEditingDescription] = useState('');
    const [isSendMenuOpen, setIsSendMenuOpen] = useState(false);
    const [imageInModal, setImageInModal] = useState<{ messageId: string, file: UploadedFile } | null>(null);
    const [fileForEditing, setFileForEditing] = useState<UploadedFile | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    const editInputRef = useRef<HTMLInputElement>(null);
    const longPressTimer = useRef<number | null>(null);
    
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [currentConversation?.messages, isThinking]);

    useEffect(() => {
        if (textAreaRef.current) {
            textAreaRef.current.style.height = 'auto';
            const scrollHeight = textAreaRef.current.scrollHeight;
            textAreaRef.current.style.height = `${scrollHeight}px`;
        }
    }, [prompt]);

    useEffect(() => {
        if (editingFileId && editInputRef.current) {
            editInputRef.current.focus();
        }
    }, [editingFileId]);
    
    useEffect(() => {
        setPrompt('');
        setUploadedFiles([]);
        setIsUploadMode(false);
        setFileForEditing(null);
    }, [currentConversation]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = event.target.files;
        if (!selectedFiles) return;

        Array.from(selectedFiles).forEach(file => {
            if (uploadedFiles.length >= 4) {
                alert("You can upload a maximum of 4 files.");
                return;
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                const newFile: UploadedFile = {
                    id: `file-${Date.now()}-${Math.random()}`,
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    data: e.target?.result as string,
                    description: '', 
                };
                setUploadedFiles(prev => [...prev, newFile]);
            };
            reader.readAsDataURL(file);
        });
        
        setIsUploadMode(false);
        
        if(fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const triggerFileInput = (accept: string) => {
        if (fileInputRef.current) {
            fileInputRef.current.accept = accept;
            fileInputRef.current.click();
        }
    };

    const handleRemoveFile = (fileId: string) => {
        setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
        if (fileForEditing?.id === fileId) {
            setFileForEditing(null);
        }
    };

    const handleEditDescription = (file: UploadedFile) => {
        setEditingFileId(file.id);
        setEditingDescription(file.description);
    };

    const handleSaveDescription = () => {
        if (!editingFileId) return;
        setUploadedFiles(prev => prev.map(f => f.id === editingFileId ? { ...f, description: editingDescription } : f));
        if (fileForEditing?.id === editingFileId) {
            setFileForEditing(prev => prev ? { ...prev, description: editingDescription } : null);
        }
        setEditingFileId(null);
        setEditingDescription('');
    };
    
    const handleDescriptionKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSaveDescription();
        }
    };

    const handleSendMessage = (mode: SendMode = 'default') => {
        if (prompt.trim() === '' && uploadedFiles.length === 0) return;

        if (fileForEditing) {
            onEditImage(prompt, fileForEditing);
            setFileForEditing(null);
        } else {
            onSendMessage(prompt, uploadedFiles, mode);
        }
        
        setPrompt('');
        setUploadedFiles([]);
        setIsSendMenuOpen(false);
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage('default');
        }
    };

    const handlePressStart = () => {
        longPressTimer.current = window.setTimeout(() => {
            setIsSendMenuOpen(true);
        }, 500);
    };

    const handlePressEnd = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    };
    
    const handleSendClick = () => {
        if (!isSendMenuOpen) {
            handleSendMessage('default');
        }
    };
    
    const hasPrompt = prompt.trim() !== '';
    const hasOneImage = uploadedFiles.length === 1 && uploadedFiles[0].type.startsWith('image/');
    const canGenerateImage = (uploadedFiles.length === 0 && hasPrompt) || (hasOneImage && hasPrompt);
    
    const sendOptions = [
        { 
            mode: 'no-thinking' as SendMode, 
            icon: ICONS.zap, 
            label: 'Quick Response',
        },
        { 
            mode: 'search' as SendMode, 
            icon: ICONS.search, 
            label: 'Search Web', 
            disabled: uploadedFiles.length > 0 
        },
        { 
            mode: 'image' as SendMode, 
            icon: ICONS.sparkles, 
            label: hasOneImage ? 'Generate with Image' : 'Generate Image', 
            disabled: !canGenerateImage 
        },
    ];


    const { primary, secondary, accent, text, icon, primaryContent } = settings.colorTheme;
    
    return (
        <div className="flex flex-col h-full w-full">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {currentConversation ? (
                    <>
                        {currentConversation.messages.map(msg => (
                            <Message 
                                key={msg.id} 
                                message={msg} 
                                settings={settings} 
                                onImageClick={(file) => setImageInModal({ messageId: msg.id, file })}
                            />
                        ))}
                        {isThinking && <ThinkingIndicator settings={settings} />}
                        <div ref={messagesEndRef} />
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <Icon svg={ICONS.bot} className={`w-16 h-16 mb-4 ${icon}`} />
                        <h2 className="text-2xl font-bold">Gemini Chat</h2>
                        <p className={`${settings.colorTheme.secondaryContent} mt-2`}>Start a new conversation by typing below.</p>
                    </div>
                )}
            </div>
            <div className={`p-4 border-t ${secondary}`} style={{ borderColor: 'rgba(128,128,128,0.2)' }}>
                {uploadedFiles.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-2">
                        {uploadedFiles.map(file => (
                             <div key={file.id} className="relative group flex items-center gap-2 p-2 pr-8 rounded-lg bg-black/10 dark:bg-white/10 text-sm">
                                {fileForEditing?.id === file.id && <Icon svg={ICONS['edit-3']} className="w-5 h-5 text-blue-400" />}
                                <Icon svg={file.type.startsWith('image') ? ICONS.image : file.type.startsWith('video') ? ICONS.video : ICONS.file} className="w-5 h-5"/>
                                {editingFileId === file.id ? (
                                    <input 
                                        ref={editInputRef}
                                        type="text"
                                        value={editingDescription}
                                        onChange={(e) => setEditingDescription(e.target.value)}
                                        onBlur={handleSaveDescription}
                                        onKeyDown={handleDescriptionKeyDown}
                                        className="bg-transparent outline-none border-b"
                                        placeholder="Add a description..."
                                    />
                                ) : (
                                    <span onClick={() => handleEditDescription(file)} className="cursor-pointer truncate max-w-xs" title="Click to add description">
                                        {file.description || file.name}
                                    </span>
                                )}
                                <button
                                    onClick={() => handleRemoveFile(file.id)}
                                    className="absolute top-1/2 right-1 -translate-y-1/2 p-0.5 rounded-full bg-black/20 hover:bg-black/40"
                                >
                                    <Icon svg={ICONS['x-circle']} className="w-4 h-4 text-white" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    multiple
                    className="hidden"
                />

                {isUploadMode ? (
                    <div className="flex items-center gap-2">
                        <div className="flex-1 grid grid-cols-3 gap-2">
                            <button onClick={() => triggerFileInput('image/*')} className={`p-4 flex flex-col items-center justify-center gap-2 rounded-lg ${secondary} hover:bg-black/10 dark:hover:bg-white/10`}>
                                <Icon svg={ICONS.image} className="w-6 h-6"/> <span>Upload Image</span>
                            </button>
                            <button onClick={() => triggerFileInput('video/*')} className={`p-4 flex flex-col items-center justify-center gap-2 rounded-lg ${secondary} hover:bg-black/10 dark:hover:bg-white/10`}>
                                <Icon svg={ICONS.video} className="w-6 h-6"/> <span>Upload Video</span>
                            </button>
                            <button onClick={() => triggerFileInput('*/*')} className={`p-4 flex flex-col items-center justify-center gap-2 rounded-lg ${secondary} hover:bg-black/10 dark:hover:bg-white/10`}>
                               <Icon svg={ICONS.file} className="w-6 h-6"/> <span>Upload File</span>
                            </button>
                        </div>
                         <button
                            onClick={() => setIsUploadMode(false)}
                            className={`p-3 rounded-full hover:bg-black/10 dark:hover:bg-white/10 ${icon} transition-transform rotate-45`}
                        >
                            <Icon svg={ICONS.plus} className="w-6 h-6" />
                        </button>
                    </div>
                ) : (
                    <div className={`relative flex items-center p-2 rounded-xl ${secondary}`}>
                        <button
                            onClick={() => setIsUploadMode(true)}
                            className={`p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 ${icon} transition-transform`}
                            title="Attach files"
                        >
                            <Icon svg={ICONS.plus} className="w-6 h-6" />
                        </button>
                        <textarea
                            ref={textAreaRef}
                            value={prompt}
                            onChange={e => setPrompt(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={fileForEditing ? "Describe your edits..." : "Type your message..."}
                            rows={1}
                            className={`flex-1 mx-2 p-2 bg-transparent resize-none focus:outline-none overflow-y-hidden ${text}`}
                            style={{ maxHeight: '200px' }}
                        />
                        <div className="relative">
                            {isSendMenuOpen && (
                                <div 
                                    className="fixed inset-0 z-40" 
                                    onClick={() => setIsSendMenuOpen(false)}
                                ></div>
                            )}
                            <button
                                onMouseDown={handlePressStart}
                                onMouseUp={handlePressEnd}
                                onMouseLeave={handlePressEnd}
                                onTouchStart={handlePressStart}
                                onTouchEnd={handlePressEnd}
                                onClick={handleSendClick}
                                disabled={isThinking || (prompt.trim() === '' && uploadedFiles.length === 0)}
                                className={`p-3 rounded-full transition-colors z-50 relative ${
                                    (prompt.trim() !== '' || uploadedFiles.length > 0) && !isThinking ? `${accent} text-white` : `${icon} opacity-50 cursor-not-allowed`
                                }`}
                            >
                                <Icon svg={ICONS.send} className="w-5 h-5" />
                            </button>
                            {isSendMenuOpen && (
                                <div className={`absolute bottom-full right-0 mb-2 w-48 p-2 rounded-lg shadow-xl z-50 ${secondary} border border-black/10 dark:border-white/10`}>
                                    <ul className="space-y-1">
                                        {sendOptions.map(option => (
                                            <li key={option.mode}>
                                                <button
                                                    onClick={() => handleSendMessage(option.mode as SendMode)}
                                                    disabled={option.disabled}
                                                    className={`w-full flex items-center gap-3 p-2 rounded-md text-sm text-left transition-colors ${primaryContent} ${option.disabled ? 'opacity-50 cursor-not-allowed' : `hover:${primary}`}`}
                                                >
                                                    <Icon svg={option.icon} className="w-5 h-5"/>
                                                    <span>{option.label}</span>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            <ImageModal 
                isOpen={!!imageInModal}
                onClose={() => setImageInModal(null)}
                file={imageInModal?.file ?? null}
                settings={settings}
                onDelete={() => {
                    if (imageInModal) {
                        onDeleteMessage(imageInModal.messageId);
                        setImageInModal(null);
                    }
                }}
                onEdit={() => {
                    if (imageInModal) {
                        setFileForEditing(imageInModal.file);
                        setUploadedFiles([imageInModal.file]);
                        setImageInModal(null);
                        textAreaRef.current?.focus();
                    }
                }}
            />
        </div>
    );
};

export default ChatView;
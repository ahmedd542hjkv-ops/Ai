import React from 'react';
import { Conversation, Settings } from '../types';
import { ICONS } from '../constants';
import Icon from './Icon';

interface SidebarProps {
    conversations: Conversation[];
    currentConversationId: string | null;
    onNewConversation: () => void;
    onSelectConversation: (id: string) => void;
    onDeleteConversation: (id: string) => void;
    onOpenSettings: () => void;
    settings: Settings;
    isSidebarOpen: boolean;
    setIsSidebarOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
    conversations,
    currentConversationId,
    onNewConversation,
    onSelectConversation,
    onDeleteConversation,
    onOpenSettings,
    settings,
    isSidebarOpen,
    setIsSidebarOpen,
}) => {
    const { primary, secondary, text, accent, icon } = settings.colorTheme;
    
    const sortedConversations = [...conversations].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return (
        <>
            <div 
                className={`fixed inset-0 z-30 bg-black/50 md:hidden transition-opacity ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsSidebarOpen(false)}
            ></div>
            <aside
                className={`absolute md:relative z-40 h-full w-64 flex-shrink-0 flex flex-col ${primary} ${text} transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
            >
                <div className="p-4 border-b" style={{ borderColor: 'rgba(128,128,128,0.2)' }}>
                    <button
                        onClick={onNewConversation}
                        className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${accent} text-white hover:opacity-90`}
                    >
                        <Icon svg={ICONS.plus} />
                        New Chat
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {sortedConversations.map(conv => {
                        const isActive = conv.id === currentConversationId;
                        return (
                            <div key={conv.id} className={`group flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors ${isActive ? secondary : `hover:${secondary}`}`} onClick={() => onSelectConversation(conv.id)}>
                                <span className="flex-1 truncate text-sm">{conv.title}</span>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onDeleteConversation(conv.id); }} 
                                    className={`p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 ${isActive ? 'opacity-100' : ''}`}
                                >
                                    <Icon svg={ICONS.trash} className="w-4 h-4" />
                                </button>
                            </div>
                        );
                    })}
                </div>
                <div className="p-4 border-t" style={{ borderColor: 'rgba(128,128,128,0.2)' }}>
                    <button
                        onClick={onOpenSettings}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors hover:${secondary}`}
                    >
                        <Icon svg={ICONS.settings} className={icon} />
                        <span className="text-sm font-medium">Settings</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;

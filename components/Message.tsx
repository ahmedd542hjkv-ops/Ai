import React, { useState } from 'react';
import { Message as MessageType, Settings, UploadedFile } from '../types';
import { ICONS } from '../constants';
import Icon from './Icon';
import SearchGrounding from './SearchGrounding';
import { marked } from 'marked';

interface MessageProps {
  message: MessageType;
  settings: Settings;
  onImageClick: (file: UploadedFile) => void;
}

const Message: React.FC<MessageProps> = ({ message, settings, onImageClick }) => {
  const { role, text, groundingChunks, files } = message;
  const isUser = role === 'user';
  const { primary, accent, primaryContent, secondaryContent, secondary } = settings.colorTheme;
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const bubbleClasses = isUser
    ? `${accent} text-white`
    : `${primary} ${primaryContent}`;

  const icon = isUser ? ICONS.user : ICONS.bot;
  const iconContainerBg = isUser ? 'transparent' : settings.colorTheme.secondary;
  const iconColor = isUser ? primaryContent : primaryContent;

  const parsedHtml = marked.parse(text);

  const FileDisplay = ({ fileList }: { fileList: NonNullable<MessageType['files']> }) => (
    <div className={`w-full grid grid-cols-2 gap-2 ${text ? 'mb-2' : ''}`}>
      {fileList.map(file => (
        <div key={file.id} className={`rounded-lg overflow-hidden border ${secondary} ${!isUser ? 'p-1 bg-black/10' : ''}`}>
          {file.type.startsWith('image/') ? (
            <img 
              src={file.data} 
              alt={file.name} 
              className={`w-full h-auto object-cover max-h-48 rounded ${!isUser ? 'cursor-pointer' : ''}`}
              onClick={() => !isUser && onImageClick(file)}
            />
          ) : (
            <div className="p-3 flex flex-col items-center justify-center text-center">
              <Icon svg={ICONS.file} className="w-8 h-8 mb-1" />
              <span className="truncate text-xs">{file.name}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className={`flex items-start gap-4 ${isUser ? 'justify-end' : ''}`}>
      {!isUser && (
        <div className={`flex-shrink-0 p-2 w-10 h-10 flex items-center justify-center rounded-full ${iconContainerBg}`}>
          <Icon svg={icon} className={iconColor} />
        </div>
      )}

      <div className={`max-w-xl lg:max-w-2xl xl:max-w-4xl w-fit flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        
        {files && files.length > 0 && <FileDisplay fileList={files} />}
        
        {text && (
            <div className={`px-5 py-3 rounded-2xl shadow-sm ${bubbleClasses}`}>
               <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: parsedHtml as string }} />
            </div>
        )}
        
        <div className="flex items-center gap-4">
            {!isUser && (
                <button onClick={handleCopy} className={`mt-2 text-xs flex items-center gap-1 ${secondaryContent} hover:opacity-80 transition-opacity`}>
                    <Icon svg={ICONS.copy} className="w-3 h-3"/> {copied ? 'Copied!' : 'Copy'}
                </button>
            )}
            {!isUser && groundingChunks && groundingChunks.length > 0 && <SearchGrounding chunks={groundingChunks} settings={settings} />}
        </div>
      </div>

       {isUser && (
        <div className={`flex-shrink-0 p-2 w-10 h-10 flex items-center justify-center rounded-full ${iconContainerBg}`}>
          <Icon svg={icon} className={iconColor} />
        </div>
      )}
    </div>
  );
};

export default Message;
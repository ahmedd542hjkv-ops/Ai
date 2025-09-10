
import React from 'react';
import { Settings } from '../types';
import { ICONS } from '../constants';
import Icon from './Icon';

interface ThinkingIndicatorProps {
  settings: Settings;
}

const ThinkingIndicator: React.FC<ThinkingIndicatorProps> = ({ settings }) => {
  const { primary, primaryContent, secondary } = settings.colorTheme;
  return (
    <div className="flex items-start gap-4 animate-pulse">
       <div className={`flex-shrink-0 p-2 rounded-full ${secondary}`}>
        <Icon svg={ICONS.bot} className={primaryContent}/>
      </div>
      <div className={`max-w-xl lg:max-w-2xl xl:max-w-4xl w-fit`}>
        <div className={`px-5 py-3 rounded-2xl shadow-sm ${primary}`}>
          <div className="flex items-center space-x-2">
            <div className={`h-2 w-2 rounded-full ${primaryContent} animate-bounce [animation-delay:-0.3s]`}></div>
            <div className={`h-2 w-2 rounded-full ${primaryContent} animate-bounce [animation-delay:-0.15s]`}></div>
            <div className={`h-2 w-2 rounded-full ${primaryContent} animate-bounce`}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThinkingIndicator;

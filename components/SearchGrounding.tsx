

import React from 'react';
import { GroundingChunk, Settings } from '../types';
import { ICONS } from '../constants';
import Icon from './Icon';

interface SearchGroundingProps {
  chunks: GroundingChunk[];
  settings: Settings;
}

const SearchGrounding: React.FC<SearchGroundingProps> = ({ chunks, settings }) => {
    const { secondary, secondaryContent, icon } = settings.colorTheme;

    if (!chunks || chunks.length === 0) {
        return null;
    }

    return (
        <div className={`mt-3 p-3 rounded-lg border ${secondary}`}>
            <h4 className={`text-sm font-semibold mb-2 ${secondaryContent}`}>Sources from the web:</h4>
            <ul className="space-y-1">
                {chunks.map((chunk, index) => (
                    // Fix: Add a check for chunk.web before accessing its properties to prevent runtime errors, as `web` is an optional property.
                    chunk.web && (
                        <li key={index}>
                            <a
                                href={chunk.web.uri}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex items-center gap-2 text-sm ${icon} hover:underline hover:opacity-80 transition-opacity`}
                            >
                                <Icon svg={ICONS.link} />
                                <span className="truncate">{chunk.web.title || chunk.web.uri}</span>
                            </a>
                        </li>
                    )
                ))}
            </ul>
        </div>
    );
};

export default SearchGrounding;

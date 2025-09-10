import React from 'react';
import { Settings, UploadedFile } from '../types';
import Icon from './Icon';
import { ICONS } from '../constants';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: UploadedFile | null;
  settings: Settings;
  onDelete: () => void;
  onEdit: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ isOpen, onClose, file, settings, onDelete, onEdit }) => {
    if (!isOpen || !file) return null;

    const { secondary, icon, text } = settings.colorTheme;

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = file.data;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
            <div className={`relative max-w-4xl max-h-[90vh] p-4 rounded-lg shadow-xl ${secondary}`} onClick={e => e.stopPropagation()}>
                <button onClick={onClose} title="Close" className={`absolute top-2 right-2 z-10 p-1 rounded-full bg-black/30 hover:bg-black/50`}>
                    <Icon svg={ICONS.close} className="w-5 h-5 text-white" />
                </button>
                <div className="relative">
                    <img src={file.data} alt={file.name} className="max-w-full max-h-[calc(90vh-100px)] object-contain rounded" />
                </div>
                <div className="mt-4 flex items-center justify-between gap-4">
                    <p className={`text-sm ${text} truncate flex-1`} title={file.description || file.name}>{file.description || file.name}</p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={handleDownload} title="Download" className={`p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 ${icon}`}>
                            <Icon svg={ICONS.download} className="w-5 h-5" />
                        </button>
                        <button onClick={onEdit} title="Edit" className={`p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 ${icon}`}>
                            <Icon svg={ICONS['edit-3']} className="w-5 h-5" />
                        </button>
                        <button onClick={onDelete} title="Delete" className={`p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-red-500`}>
                            <Icon svg={ICONS.trash} className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageModal;

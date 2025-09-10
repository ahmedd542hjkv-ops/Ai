import React from 'react';
import { Settings, ColorTheme } from '../types';
import { FONTS, COLORS, ICONS, CUSTOM_COLOR_PALETTE } from '../constants';
import Icon from './Icon';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onUpdateSettings: (newSettings: Settings) => void;
  onResetSettings: () => void;
}

// Helper to extract the base color name (e.g., 'slate-900') from a full Tailwind class (e.g., 'bg-slate-900')
const getBaseColor = (className: string) => className.split(/[- ]/).slice(1).join('-');

const ColorPickerRow: React.FC<{
  label: string;
  selectedValue: string;
  onColorSelect: (colorValue: string) => void;
  prefix: 'bg' | 'text';
  accentColor: string;
}> = ({ label, selectedValue, onColorSelect, prefix, accentColor }) => (
  <div>
    <label className="block font-semibold mb-3">{label}</label>
    <div className="flex flex-wrap gap-3">
      {CUSTOM_COLOR_PALETTE.map(color => {
        const isSelected = getBaseColor(selectedValue) === color.value;
        return (
          <button
            key={color.name}
            title={color.name}
            onClick={() => onColorSelect(color.value)}
            className={`w-8 h-8 rounded-full ${`bg-${color.value}`} transition-transform hover:scale-110 focus:outline-none ${isSelected ? `ring-2 ring-offset-2 ${accentColor.replace('bg-', 'ring-')} ${accentColor.replace('bg-', 'ring-offset-')}` : ''}`}
            aria-label={`Select ${color.name} color`}
          />
        );
      })}
    </div>
  </div>
);


const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose, settings, onUpdateSettings, onResetSettings }) => {
  if (!isOpen) return null;

  const { primary, secondary, text, accent, icon } = settings.colorTheme;

  const handleSettingChange = <K extends keyof Settings,>(key: K, value: Settings[K]) => {
    onUpdateSettings({ ...settings, [key]: value });
  };
  
  const handleColorThemeChange = (colorName: string) => {
    const newTheme = COLORS.find(c => c.name === colorName) || COLORS[0];
    handleSettingChange('colorTheme', newTheme);
  };
  
  const handleColorThemePropertyChange = (prop: keyof ColorTheme, value: string) => {
    const newColorTheme = { ...settings.colorTheme, [prop]: value };
    handleSettingChange('colorTheme', newColorTheme);
  };
  
  const handleTextColorChange = (colorValue: string) => {
      const newColorTheme = { 
          ...settings.colorTheme,
          text: `text-${colorValue}`,
          primaryContent: `text-${colorValue}`,
          secondaryContent: `text-${colorValue.replace('500','400').replace('800','600').replace('200','300')}`
      };
      handleSettingChange('colorTheme', newColorTheme);
  }

  const handleFontChange = (fontName: string) => {
    const newFont = FONTS.find(f => f.name === fontName) || FONTS[0];
    handleSettingChange('font', newFont);
  };
  
  return (
    <div className={`fixed inset-0 z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose}>
      <div className={`absolute inset-0 bg-black/50`}></div>
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-sm flex flex-col shadow-2xl transition-transform duration-300 ${primary} ${text} ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex items-center justify-between p-4 border-b ${secondary}`}>
          <h2 className="text-xl font-bold">Settings</h2>
          <div className="flex items-center gap-2">
            <button onClick={onResetSettings} title="Reset to Defaults" className={`p-1 rounded-full hover:${secondary} transition-colors`}>
                <Icon svg={ICONS.reset} className={icon} />
            </button>
            <button onClick={onClose} className={`p-1 rounded-full hover:${secondary} transition-colors`}>
                <Icon svg={ICONS.close} className={icon} />
            </button>
          </div>
        </div>

        <div className="flex-1 p-6 space-y-8 overflow-y-auto">
          {/* Theme Toggle */}
          <div>
            <label className="block font-semibold mb-2">Theme</label>
            <div className={`flex rounded-lg p-1 ${secondary}`}>
              <button onClick={() => handleSettingChange('theme', 'light')} className={`w-1/2 py-2 flex items-center justify-center gap-2 rounded-md transition-colors ${settings.theme === 'light' ? accent : ''}`}>
                <Icon svg={ICONS.sun} /> Light
              </button>
              <button onClick={() => handleSettingChange('theme', 'dark')} className={`w-1/2 py-2 flex items-center justify-center gap-2 rounded-md transition-colors ${settings.theme === 'dark' ? accent : ''}`}>
                <Icon svg={ICONS.moon} /> Dark
              </button>
            </div>
          </div>

          {/* Color Theme */}
          <div>
            <label className="block font-semibold mb-2">Color Palette</label>
            <div className="grid grid-cols-5 gap-3">
              {COLORS.map(color => (
                <div key={color.name} className="flex flex-col items-center gap-1">
                    <button
                      onClick={() => handleColorThemeChange(color.name)}
                      className={`w-10 h-10 rounded-full transition-all duration-200 flex items-center justify-center border-2 ${settings.colorTheme.name === color.name ? accent.replace('bg-', 'border-') : 'border-transparent'}`}
                      aria-label={`Select ${color.name} theme`}
                    >
                      <div className={`w-8 h-8 rounded-full ${color.accent}`}></div>
                    </button>
                     <span className="text-xs">{color.name}</span>
                </div>
              ))}
            </div>
          </div>
          
          <hr className={secondary}/>

          {/* Custom Colors */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold">Custom Colors</h3>
            <ColorPickerRow 
                label="Background Color"
                selectedValue={settings.colorTheme.bg}
                onColorSelect={(colorValue) => handleColorThemePropertyChange('bg', settings.theme === 'dark' ? `bg-${colorValue.replace('500','900')}` : `bg-${colorValue.replace('500','100')}`)}
                prefix="bg"
                accentColor={accent}
            />
            <ColorPickerRow 
                label="Text Color"
                selectedValue={settings.colorTheme.text}
                onColorSelect={handleTextColorChange}
                prefix="text"
                accentColor={accent}
            />
            <ColorPickerRow 
                label="Icon Color"
                selectedValue={settings.colorTheme.icon}
                onColorSelect={(colorValue) => handleColorThemePropertyChange('icon', `text-${colorValue}`)}
                prefix="text"
                accentColor={accent}
            />
             <ColorPickerRow 
                label="Your Message Bubbles"
                selectedValue={settings.colorTheme.accent}
                onColorSelect={(colorValue) => handleColorThemePropertyChange('accent', `bg-${colorValue}`)}
                prefix="bg"
                accentColor={accent}
            />
             <ColorPickerRow 
                label="AI's Message Bubbles"
                selectedValue={settings.colorTheme.primary}
                onColorSelect={(colorValue) => handleColorThemePropertyChange('primary', settings.theme === 'dark' ? `bg-${colorValue.replace('500','800')}` : `bg-${colorValue.replace('500','200')}`)}
                prefix="bg"
                accentColor={accent}
            />
          </div>
          
          <hr className={secondary}/>
          
          {/* System Prompt */}
          <div>
            <label htmlFor="system-prompt" className="block font-semibold mb-2">AI Persona</label>
            <textarea
              id="system-prompt"
              rows={4}
              value={settings.systemPrompt}
              onChange={(e) => handleSettingChange('systemPrompt', e.target.value)}
              className={`w-full p-2 rounded-lg border bg-transparent ${secondary} focus:ring-2 focus:${accent.replace('bg-','ring-')} outline-none transition-all`}
              placeholder="e.g., You are a pirate... The AI will automatically respond in your language."
            />
          </div>

          {/* Font Family */}
          <div>
            <label htmlFor="font-family" className="block font-semibold mb-2">Font Family</label>
            <select
              id="font-family"
              value={settings.font.name}
              onChange={(e) => handleFontChange(e.target.value)}
              className={`w-full p-2 rounded-lg border bg-transparent ${secondary} focus:ring-2 focus:${accent.replace('bg-','ring-')} outline-none transition-all`}
            >
              {FONTS.map(font => <option key={font.name} value={font.name}>{font.name}</option>)}
            </select>
          </div>

          {/* Font Size */}
          <div>
            <label htmlFor="font-size" className="block font-semibold mb-2">Font Size ({settings.fontSize}px)</label>
            <input
              id="font-size"
              type="range"
              min="12"
              max="24"
              step="1"
              value={settings.fontSize}
              onChange={(e) => handleSettingChange('fontSize', parseInt(e.target.value, 10))}
              className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${accent}`}
            />
          </div>

        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
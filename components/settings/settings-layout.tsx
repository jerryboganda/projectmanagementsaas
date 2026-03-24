'use client';

import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { SettingsSidebar } from './settings-sidebar';
import { SettingsContent } from './settings-content';
import { SettingsCategory } from './data';

export function SettingsLayout() {
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('general');

  return (
    <div className="flex flex-1 overflow-hidden bg-background-dark">
      <SettingsSidebar 
        activeCategory={activeCategory} 
        onSelectCategory={setActiveCategory} 
      />
      
      <div className="flex-1 overflow-y-auto custom-scrollbar relative">
        <AnimatePresence mode="wait">
          <SettingsContent 
            key={activeCategory} 
            activeCategory={activeCategory} 
          />
        </AnimatePresence>
      </div>
    </div>
  );
}


import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { EffectWindowConfig, CategorizedSidebarEffectGroup } from '../types';
import { CategoryAccordionItem } from './ui/CategoryAccordionItem';

interface SidebarProps {
  isVisible: boolean;
  categorizedEffects: CategorizedSidebarEffectGroup[];
  onToggleEffectInRightSidebar: (id: string) => void;
  activeEffectsInRightSidebarIds: Set<string>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isVisible,
  categorizedEffects,
  onToggleEffectInRightSidebar,
  activeEffectsInRightSidebarIds,
}) => {
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Open default categories based on the defaultOpen flag
    const defaultOpen = new Set<string>();
    categorizedEffects.forEach(group => {
      if (group.defaultOpen) {
        defaultOpen.add(group.categoryName);
      }
    });
    setOpenCategories(defaultOpen);
  }, [categorizedEffects]);


  const toggleCategory = (categoryName: string) => {
    setOpenCategories(prevOpen => {
      const newOpen = new Set(prevOpen);
      if (newOpen.has(categoryName)) {
        newOpen.delete(categoryName);
      } else {
        newOpen.add(categoryName);
      }
      return newOpen;
    });
  };

  return (
    <div
      id="controls-sidebar"
      className={`fixed top-14 left-0 h-[calc(100vh-3.5rem)] w-72 z-20 bg-gray-900 border-r border-gray-700 transition-transform duration-300 ease-in-out p-4 flex flex-col gap-y-2 transform custom-scrollbar overflow-y-auto ${
        isVisible ? 'translate-x-0' : '-translate-x-full'
      }`}
      aria-hidden={!isVisible}
    >
      <h2 className="font-orbitron text-xl font-bold text-green-400 text-center mb-3">SYNTH SECTIONS</h2>
      <div className="flex flex-col gap-y-1">
        {categorizedEffects.map((group) => (
          <CategoryAccordionItem
            key={group.categoryName}
            id={`category-${group.categoryName.replace(/\s+/g, '-')}`}
            title={group.categoryName}
            isOpen={openCategories.has(group.categoryName)}
            onToggle={() => toggleCategory(group.categoryName)}
          >
            <div className="flex flex-col gap-y-1.5 pl-2 pt-1 pb-1">
              {group.effects.map((effect) => (
                <Button
                  key={effect.id}
                  variant="secondary"
                  onClick={() => onToggleEffectInRightSidebar(effect.id)}
                  className={`w-full text-left text-xs px-3 py-1.5 ${
                    activeEffectsInRightSidebarIds.has(effect.id)
                      ? 'bg-green-600 hover:bg-green-700 text-white ring-1 ring-green-400'
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
                  aria-pressed={activeEffectsInRightSidebarIds.has(effect.id)}
                >
                  {effect.title}
                </Button>
              ))}
            </div>
          </CategoryAccordionItem>
        ))}
      </div>
    </div>
  );
};

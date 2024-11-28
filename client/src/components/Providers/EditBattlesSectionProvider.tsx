import { createContext, useContext, useState } from 'react';
import { IBattleCard, IBattlesSection, IBracket } from '../../types/types';

interface BattlesSectionContextType {
  sectionData: IBattlesSection;
  updateSection: (updatedSection: Partial<IBattlesSection>) => void;
  updateBracket: (bracketIndex: number, updatedBracket: Partial<IBracket>) => void;
  updateBattleCard: (
    bracketIndex: number,
    cardIndex: number,
    updatedBattleCard: Partial<IBattleCard>
  ) => void;
}

const BattlesSectionContext = createContext<BattlesSectionContextType | null>(null);

interface BattlesSectionProviderProps {
  initialSection: IBattlesSection;
  children: React.ReactNode;
}

export function EditBattlesSectionProvider({
  initialSection,
  children,
}: BattlesSectionProviderProps) {
  const [section, setSection] = useState(initialSection);

  const updateSection = (updatedSection: Partial<IBattlesSection>) => {
    setSection((prevSection) => ({
      ...prevSection,
      ...updatedSection,
    }));
  };

  const updateBracket = (bracketIndex: number, updatedBracket: Partial<IBracket>) => {
    setSection((prevSection) => {
      const newBrackets = [...prevSection.brackets];
      newBrackets[bracketIndex] = {
        ...newBrackets[bracketIndex],
        ...updatedBracket,
      };

      return {
        ...prevSection,
        brackets: newBrackets,
      };
    });
  };

  const updateBattleCard = (
    bracketIndex: number,
    cardIndex: number,
    updatedBattleCard: Partial<IBattleCard>
  ) => {
    setSection((prevSection) => {
      const newBrackets = [...prevSection.brackets];
      const newBattleCards = [...newBrackets[bracketIndex].battleCards];

      newBattleCards[cardIndex] = {
        ...newBattleCards[cardIndex],
        ...updatedBattleCard,
      };

      newBrackets[bracketIndex] = {
        ...newBrackets[bracketIndex],
        battleCards: newBattleCards,
      };

      return {
        ...prevSection,
        brackets: newBrackets,
      };
    });
  };

  return (
    <BattlesSectionContext.Provider
      value={{
        sectionData: section,
        updateSection,
        updateBracket,
        updateBattleCard,
      }}
    >
      {children}
    </BattlesSectionContext.Provider>
  );
}

export const useBattlesSectionContext = () => {
  const context = useContext(BattlesSectionContext);
  if (context === null) {
    throw new Error('useBattlesSectionContext must be used within a BattlesSectionProvider');
  }
  return context;
};

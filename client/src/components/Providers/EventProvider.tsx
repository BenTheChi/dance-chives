import { createContext, useContext, useState } from 'react';
import initialEventData from '../../single-event-test.json';
import {
  IBattleCard,
  IBattlesSection,
  IBracket,
  IPartiesSection,
  IPerformancesSection,
  ISection,
  IWorkshopsSection,
} from '../../types/types';

// Define the full context type
interface EventContextType {
  eventData: typeof initialEventData;
  updateSection: (
    sectionIndex: number,
    updatedSection: IBattlesSection | IWorkshopsSection
  ) => void;
  updateBracket: (sectionIndex: number, bracketIndex: number, updatedBracket: IBracket) => void;
  updateBattleCard: (
    sectionIndex: number,
    bracketIndex: number,
    cardIndex: number,
    updatedBattleCard: IBattleCard
  ) => void;
  addSection: (
    section: IBattlesSection | IWorkshopsSection | IPerformancesSection | IPartiesSection
  ) => void;
}

// Create context with explicit type
const EventContext = createContext<EventContextType | null>(null);

interface EventProviderProps {
  initialEventData: typeof import('../../single-event-test.json');
  children: React.ReactNode;
}

export function EventProvider({ initialEventData, children }: EventProviderProps) {
  const [eventData, setEventData] = useState(initialEventData);

  const addSection = (section: ISection) => {
    setEventData((prevState) => {
      const newState = { ...prevState };
      newState.sections.push(section);
      return newState;
    });
  };

  const updateSection = (
    sectionIndex: number,
    updatedSection: IBattlesSection | IWorkshopsSection
  ) => {
    setEventData((prevState) => {
      const newState = { ...prevState };
      newState.sections[sectionIndex] = {
        ...updatedSection,
      };

      return newState;
    });
  };

  const updateBracket = (sectionIndex: number, bracketIndex: number, updatedBracket: IBracket) => {
    setEventData((prevState) => {
      if (prevState.sections[sectionIndex].type !== 'battles') {
        return prevState;
      }

      const newState = { ...prevState };
      (newState.sections[sectionIndex] as IBattlesSection).brackets[bracketIndex] = {
        ...updatedBracket,
      };

      return newState;
    });
  };

  const updateBattleCard = (
    sectionIndex: number,
    bracketIndex: number,
    cardIndex: number,
    updatedBattleCard: IBattleCard
  ) => {
    setEventData((prevState) => {
      if (prevState.sections[sectionIndex].type !== 'battles') {
        return prevState;
      }

      const newState = { ...prevState };
      (newState.sections[sectionIndex] as IBattlesSection).brackets[bracketIndex].battleCards[
        cardIndex
      ] = {
        ...updatedBattleCard,
      };

      return newState;
    });
  };

  return (
    <EventContext.Provider
      value={{
        eventData,
        updateSection,
        updateBracket,
        updateBattleCard,
        addSection,
      }}
    >
      {children}
    </EventContext.Provider>
  );
}

// Export the hook for using the context
export const useEventContext = () => {
  const context = useContext(EventContext);
  if (context === null) {
    throw new Error('useEventContext must be used within an EventProvider');
  }
  return context;
};

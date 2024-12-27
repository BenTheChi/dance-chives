import { createContext, useContext, useState } from 'react';
import {
  IBattleCard,
  IBattlesSection,
  IBracket,
  IEvent,
  IPartiesSection,
  IPerformancesSection,
  ISection,
  IWorkshopsSection,
} from '../../types/types';

// Define the full context type
interface EventContextType {
  eventData: IEvent;
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
  setEventData: (eventData: IEvent) => void;
}

// Create context with explicit type
const EventContext = createContext<EventContextType | null>(null);

interface EventProviderProps {
  initialEventData: IEvent;
  children: React.ReactNode;
}

export function EventProvider({ initialEventData, children }: EventProviderProps) {
  const [eventData, setEventData] = useState<IEvent>(initialEventData);

  const addSection = (section: ISection) => {
    setEventData((prevState) => {
      const newState = { ...prevState };
      newState.sections.push(section);
      return newState;
    });
  };

  const updateSection = (
    sectionIndex: number,
    updatedSection: IBattlesSection | IWorkshopsSection | IPerformancesSection | IPartiesSection
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
        eventData: eventData as IEvent,
        updateSection,
        updateBracket,
        updateBattleCard,
        addSection,
        setEventData,
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

import { createContext, useContext, useState } from 'react';
import initialEventData from '../../single-event-test.json';

// Define the full context type
interface EventContextType {
  eventData: typeof initialEventData;
  updateSection: (sectionIndex: number, updatedSection: BattlesSection) => void;
  updateBracket: (sectionIndex: number, bracketIndex: number, updatedBracket: Bracket) => void;
  updateBattleCard: (
    sectionIndex: number,
    bracketIndex: number,
    cardIndex: number,
    updatedBattleCard: BattleCard
  ) => void;
}

// Create context with explicit type
const EventContext = createContext<EventContextType | null>(null);

interface BattleCard {
  title: string;
  src: string;
  teams:
    | {
        name: string;
        members: string[];
        winner: boolean;
      }[]
    | [];
  dancers: string[];
}

interface Bracket {
  type: string;
  battleCards: BattleCard[];
}

interface BattlesSection {
  type: string;
  format: string;
  styles: string[];
  judges: string[];
  brackets: Bracket[];
}

interface WorkshopCard {
  title: string;
  images: string[];
  date: number;
  address: string;
  cost: string;
  styles: string[];
  teacher: string[];
  recapSrc: string;
}

interface WorkshopsSection {
  type: string;
  workshopCards: WorkshopCard[];
}

interface EventProviderProps {
  initialEventData: typeof import('../../single-event-test.json');
  children: React.ReactNode;
}

export function EventProvider({ initialEventData, children }: EventProviderProps) {
  const [eventData, setEventData] = useState(initialEventData);

  // Update any video battle result within the nested structure
  //   const updateBattleResult = (sectionIndex: number, bracketIndex: number, videoIndex: number, winningTeamIndex: number) => {

  //     setEventData(prevState => {
  //       const newState = { ...prevState };
  //       const battleCard = newState.sections[sectionIndex].brackets[bracketIndex].battleCards[videoIndex];

  //       // Update the winner in the teams array
  //       battleCard.teams.forEach((team, index) => {
  //         team.winner = (index === winningTeamIndex);
  //       });

  //       return newState;
  //     });
  //   };

  const updateSection = (
    sectionIndex: number,
    updatedSection: BattlesSection | WorkshopsSection
  ) => {
    setEventData((prevState) => {
      const newState = { ...prevState };
      newState.sections[sectionIndex] = {
        ...updatedSection,
      };

      return newState;
    });
  };

  const updateBracket = (sectionIndex: number, bracketIndex: number, updatedBracket: Bracket) => {
    setEventData((prevState) => {
      if (prevState.sections[sectionIndex].type !== 'battles') {
        return prevState;
      }

      const newState = { ...prevState };
      (newState.sections[sectionIndex] as BattlesSection).brackets[bracketIndex] = {
        ...updatedBracket,
      };

      return newState;
    });
  };

  const updateBattleCard = (
    sectionIndex: number,
    bracketIndex: number,
    cardIndex: number,
    updatedBattleCard: BattleCard
  ) => {
    setEventData((prevState) => {
      if (prevState.sections[sectionIndex].type !== 'battles') {
        return prevState;
      }

      const newState = { ...prevState };
      (newState.sections[sectionIndex] as BattlesSection).brackets[bracketIndex].battleCards[
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

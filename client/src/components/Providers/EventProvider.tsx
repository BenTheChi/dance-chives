import { createContext, useContext, useState } from 'react';
import {
  IBattleCard,
  IBattlesSection,
  IEvent,
  IPartiesSection,
  IPartyCard,
  IPerformanceCard,
  IPerformancesSection,
  ISection,
  IWorkshopCard,
  IWorkshopsSection,
} from '../../types/types';

// Define the full context type
interface EventContextType {
  eventData: IEvent;
  updateEventData: (newEventData: IEvent) => void;
  addCard: (sectionIndex: number, bracketIndex?: number) => void;
  deleteSection: (sectionIndex: number) => void;
  updateBattlesSectionEditable: (sectionIndex: number, isEditable: boolean) => void;
  updateSection: (sectionIndex: number, updatedSection: ISection) => void;
  updateCard: (
    sectionIndex: number,
    cardIndex: number,
    payload: IBattleCard | IPartyCard | IPerformanceCard | IWorkshopCard,
    bracketIndex?: number
  ) => void;
  deleteCard: (sectionIndex: number, cardIndex: number, bracketIndex?: number) => void;
  updateCardEditable: (
    sectionIndex: number,
    cardIndex: number,
    isEditable: boolean,
    bracketIndex?: number
  ) => void;
  addSection: (section: string) => void;
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

  const updateEventData = (newEventData: IEvent) => {
    setEventData((prevState) => {
      return { ...prevState, ...newEventData };
    });
  };

  const deleteSection = (sectionIndex: number) => {
    setEventData((prevState) => {
      const newState = { ...prevState };
      newState.sections.splice(sectionIndex, 1);
      return newState;
    });
  };

  const addCard = (sectionIndex: number, bracketIndex?: number) => {
    setEventData((prevState) => {
      const newState = { ...prevState };

      if (newState.sections[sectionIndex].type === 'workshops') {
        (newState.sections[sectionIndex] as IWorkshopsSection).workshopCards.push({
          order: newState.sections[sectionIndex].workshopCards.length,
          uuid: '',
          isEditable: true,
          title: '',
          image: '',
          date: new Date().getTime() / 1000,
          address: '',
          cost: '',
          styles: [],
          teachers: [],
          recapSrc: '',
        });
      } else if (newState.sections[sectionIndex].type === 'parties') {
        (newState.sections[sectionIndex] as IPartiesSection).partyCards.push({
          order: newState.sections[sectionIndex].partyCards.length,
          uuid: '',
          title: '',
          image: '',
          date: new Date().getTime() / 1000,
          address: '',
          cost: '',
          dj: [],
          isEditable: true,
        });
      } else if (newState.sections[sectionIndex].type === 'performances') {
        (newState.sections[sectionIndex] as IPerformancesSection).performanceCards.push({
          order: newState.sections[sectionIndex].performanceCards.length,
          uuid: '',
          isEditable: true,
          title: '',
          src: '',
          dancers: [],
        });
      } else if (newState.sections[sectionIndex].type === 'battles') {
        if (bracketIndex !== undefined) {
          console.log(newState.sections[sectionIndex].brackets[bracketIndex].battleCards);
          (newState.sections[sectionIndex] as IBattlesSection).brackets[
            bracketIndex
          ].battleCards.push({
            order: newState.sections[sectionIndex].brackets[bracketIndex].battleCards.length,
            uuid: '',
            title: '',
            src: '',
            winners: [],
            dancers: [],
            isEditable: true,
          });
        }
      }

      return newState;
    });
  };

  const updateCard = (
    sectionIndex: number,
    cardIndex: number,
    payload: IBattleCard | IPartyCard | IPerformanceCard | IWorkshopCard,
    bracketIndex?: number
  ) => {
    setEventData((prevState) => {
      const newState = { ...prevState };

      if (newState.sections[sectionIndex].type === 'workshops') {
        (newState.sections[sectionIndex] as IWorkshopsSection).workshopCards[cardIndex] =
          payload as IWorkshopCard;
      } else if (newState.sections[sectionIndex].type === 'parties') {
        (newState.sections[sectionIndex] as IPartiesSection).partyCards[cardIndex] =
          payload as IPartyCard;
      } else if (newState.sections[sectionIndex].type === 'performances') {
        (newState.sections[sectionIndex] as IPerformancesSection).performanceCards[cardIndex] =
          payload as IPerformanceCard;
      } else if (newState.sections[sectionIndex].type === 'battles') {
        if (bracketIndex) {
          (newState.sections[sectionIndex] as IBattlesSection).brackets[bracketIndex].battleCards[
            cardIndex
          ] = payload as IBattleCard;
        }
      }

      return newState;
    });
  };

  const deleteCard = (sectionIndex: number, cardIndex: number, bracketIndex?: number) => {
    setEventData((prevState) => {
      const newState = { ...prevState };

      if (newState.sections[sectionIndex].type === 'workshops') {
        newState.sections[sectionIndex].workshopCards.splice(cardIndex, 1);
      } else if (newState.sections[sectionIndex].type === 'parties') {
        newState.sections[sectionIndex].partyCards.splice(cardIndex, 1);
      } else if (newState.sections[sectionIndex].type === 'performances') {
        newState.sections[sectionIndex].performanceCards.splice(cardIndex, 1);
      } else if (newState.sections[sectionIndex].type === 'battles') {
        if (bracketIndex !== undefined) {
          newState.sections[sectionIndex].brackets[bracketIndex].battleCards.splice(cardIndex, 1);
        }
      }

      return newState;
    });
  };

  const updateCardEditable = (
    sectionIndex: number,
    cardIndex: number,
    isEditable: boolean,
    bracketIndex?: number
  ) => {
    setEventData((prevState) => {
      const newState = { ...prevState };

      if (newState.sections[sectionIndex].type === 'workshops') {
        newState.sections[sectionIndex].workshopCards[cardIndex].isEditable = isEditable;
      } else if (newState.sections[sectionIndex].type === 'parties') {
        newState.sections[sectionIndex].partyCards[cardIndex].isEditable = isEditable;
      } else if (newState.sections[sectionIndex].type === 'performances') {
        newState.sections[sectionIndex].performanceCards[cardIndex].isEditable = isEditable;
      } else if (newState.sections[sectionIndex].type === 'battles') {
        if (bracketIndex !== undefined) {
          newState.sections[sectionIndex].brackets[bracketIndex].battleCards[cardIndex].isEditable =
            isEditable;
        }
      }

      return newState;
    });
  };

  const updateBattlesSectionEditable = (sectionIndex: number, isEditable: boolean) => {
    setEventData((prevState) => {
      const newState = { ...prevState };
      (newState.sections[sectionIndex] as IBattlesSection).isEditable = isEditable;
      return newState;
    });
  };

  const addSection = (type: string) => {
    setEventData((prevState) => {
      const newState = { ...prevState };
      let section: ISection;

      switch (type) {
        case 'battles':
          section = {
            order: eventData.sections.length,
            isEditable: true,
            uuid: '',
            type: 'battles',
            format: '1v1 All Styles',
            styles: [],
            judges: [],
            brackets: [],
          };
          break;
        case 'workshops':
          section = {
            order: eventData.sections.length,
            uuid: '',
            type: 'workshops',
            workshopCards: [],
          };
          break;
        case 'parties':
          section = {
            order: eventData.sections.length,
            uuid: '',
            type: 'parties',
            partyCards: [],
          };
          break;
        case 'performances':
          section = {
            order: eventData.sections.length,
            uuid: '',
            type: 'performances',
            performanceCards: [],
          };
          break;

        //Default to battles
        default:
          section = {
            order: eventData.sections.length,
            isEditable: true,
            uuid: '',
            type: 'battles',
            format: '2v2 Popping',
            styles: [],
            judges: [],
            brackets: [],
          };
          break;
      }

      newState.sections.push(section);
      return newState;
    });
  };

  const updateSection = (sectionIndex: number, updatedSection: ISection) => {
    setEventData((prevState) => ({
      ...prevState,
      sections: prevState.sections.map((section, index) =>
        index === sectionIndex ? { ...updatedSection } : section
      ),
    }));
  };

  return (
    <EventContext.Provider
      value={{
        eventData: eventData as IEvent,
        updateEventData,
        addCard,
        deleteSection,
        updateCard,
        deleteCard,
        updateCardEditable,
        updateBattlesSectionEditable,
        updateSection,
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

import { gql } from '@apollo/client';

export const getEvent = (id: string) => gql`
query GetEvent {
  events(where: { titleSlug: "${id}"}) {
    uuid
    title
    date
    description
    address
    addressName
    cost
    images
    prizes
    promoVideo
    recapVideo
    organizers {
      uuid
      displayName
      email
    }
    mcs {
      uuid
      displayName
      email
    }
    djs {
      uuid
      displayName
      email
    }
    videographers {
      uuid
      displayName
      email
    }
    graphicDesigners {
      uuid
      displayName
      email
    }
    photographers {
      uuid
      displayName
      email
    }
    inCity {
      name
    }
    styles {
      name
    }
    battleSections: sectionsPartOf(where: { type: "battles" }) {
      order
      uuid
      type
      format
      styles {
        name
      }
      judges {
        uuid
        email
        displayName
      }
      brackets {
        uuid
        type
        order
        battleCards {
          order
          uuid
          title
          src
          dancers {
            uuid
            email
            displayName
          }
          winners {
            uuid
            email
            displayName
          }
        }
      }
    }
    performanceSections: sectionsPartOf(where: { type: "performances" }) {
      order
      uuid
      type
      performanceCardsIn {
        uuid
        order
        title
        src
        dancers {
          uuid
          email
          displayName
        }
      }
    }
    workshopSections: sectionsPartOf(where: { type: "workshops" }) {
      order
      uuid
      type
      workshopCardsIn {
        uuid
        order
        title
        cost
        date
        address
        image
        recapSrc
        styles {
          name
        }
        teachers {
          uuid
          email
          displayName
        }
      }
    }
  }
}
`;

export const GET_EVENTS = gql`
  query GetEvent {
    events {
      uuid
      title
      date
      images
      inCity {
        name
      }
      styles {
        name
      }
      hasBattle
      hasPerformance
      hasWorkshop
      hasParty
    }
  }
`;

export const UPDATE_EVENT = gql`
  mutation UpdateEvents($where: EventWhere!, $update: EventUpdateInput!) {
    updateEvents(where: $where, update: $update) {
      events {
        uuid
        title
        date
        addressName
        address
        cost
        prizes
        description
        recapVideo
        images
        inCity {
          name
        }
        styles {
          name
        }
        organizers {
          displayName
        }
        djs {
          displayName
        }
        mcs {
          displayName
        }
      }
    }
  }
`;

export const UPDATE_EVENTS = gql`
  mutation UpdateEvents($where: EventWhere!, $update: EventUpdateInput!) {
    updateEvents(where: $where, update: $update) {
      events {
        uuid
        title
        date
        addressName
        address
        cost
        prizes
        description
        recapVideo
        images
        inCity {
          name
        }
        styles {
          name
        }
        organizers {
          displayName
        }
        djs {
          displayName
        }
        mcs {
          displayName
        }
        videographers {
          displayName
        }
        photographers {
          displayName
        }
        graphicDesigners {
          displayName
        }
      }
    }
  }
`;

export const CREATE_EVENTS = gql`
  mutation CreateEvents($input: [EventCreateInput!]!) {
    createEvents(input: $input) {
      events {
        uuid
        title
        date
        addressName
        address
        cost
        prizes
        description
        recapVideo
        images
        inCity {
          name
          state
          country
        }
        styles {
          name
        }
        organizers {
          displayName
        }
        djs {
          displayName
        }
        mcs {
          displayName
        }
        videographers {
          displayName
        }
        photographers {
          displayName
        }
        graphicDesigners {
          displayName
        }
      }
    }
  }
`;

export const UPDATE_BATTLE_SECTION = gql`
  mutation UpdateSections($where: SectionWhere!, $update: SectionUpdateInput) {
    updateSections(where: $where, update: $update) {
      sections {
        order
        uuid
        type
        format
        styles {
          name
        }
        judges {
          uuid
          email
          displayName
        }
        brackets {
          uuid
          type
          order
          battleCards {
            order
            uuid
            title
            src
            dancers {
              uuid
              email
              displayName
            }
            winners {
              uuid
              email
              displayName
            }
          }
        }
      }
    }
  }
`;

export const CREATE_PERFORMANCE_SECTION = gql`
  mutation CreateSections($input: [SectionCreateInput!]!) {
    createSections(input: $input) {
      sections {
        order
        uuid
        type
        performanceCardsIn {
          order
          title
          src
          dancers {
            uuid
            email
            displayName
          }
        }
      }
    }
  }
`;

export const CREATE_WORKSHOP_SECTION = gql`
  mutation CreateSections($input: [SectionCreateInput!]!) {
    createSections(input: $input) {
      sections {
        order
        uuid
        type
        workshopCardsIn {
          order
          title
          cost
          date
          address
          image
          recapSrc
          styles {
            name
          }
          teachers {
            uuid
            email
            displayName
          }
        }
      }
    }
  }
`;

export const CREATE_BATTLE_SECTION = gql`
  mutation CreateSections($input: [SectionCreateInput!]!) {
    createSections(input: $input) {
      sections {
        order
        uuid
        type
        format
        styles {
          name
        }
        judges {
          uuid
          email
          displayName
        }
        brackets {
          uuid
          type
          order
          battleCards {
            order
            uuid
            title
            src
            dancers {
              uuid
              email
              displayName
            }
            winners {
              uuid
              email
              displayName
            }
          }
        }
      }
    }
  }
`;

export const DELETE_BATTLE_SECTION = gql`
  mutation DeleteSections($where: SectionWhere!) {
    deleteSections(where: $where, delete: { brackets: { delete: { battleCards: {} } } }) {
      nodesDeleted
      relationshipsDeleted
    }
  }
`;

export const DELETE_WORKSHOP_SECTION = gql`
  mutation DeleteSections($where: SectionWhere!) {
    deleteSections(where: $where, delete: { workshopCardsIn: {} }) {
      nodesDeleted
      relationshipsDeleted
    }
  }
`;

export const DELETE_PERFORMANCE_SECTION = gql`
  mutation DeleteSections($where: SectionWhere!) {
    deleteSections(where: $where, delete: { performanceCardsIn: {} }) {
      nodesDeleted
      relationshipsDeleted
    }
  }
`;

export const UPDATE_BRACKET = gql`
  mutation UpdateBrackets($where: BracketWhere!, $update: BracketUpdateInput) {
    updateBrackets(where: $where, update: $update) {
      brackets {
        uuid
        type
        order
        battleCards {
          order
          uuid
          title
          src
          dancers {
            uuid
            email
            displayName
          }
          winners {
            uuid
            email
            displayName
          }
        }
      }
    }
  }
`;

export const CREATE_BATTLE_CARD = gql`
  mutation CreateBattleCards($input: [BattleCardCreateInput!]!) {
    createBattleCards(input: $input) {
      battleCards {
        order
        uuid
        title
        src
        dancers {
          uuid
          email
          displayName
        }
        winners {
          uuid
          email
          displayName
        }
      }
    }
  }
`;

export const DELETE_BATTLE_CARD = gql`
  mutation DeleteBattleCards($where: BattleCardWhere!) {
    deleteBattleCards(where: $where) {
      nodesDeleted
      relationshipsDeleted
    }
  }
`;

export const UPDATE_BATTLE_CARD = gql`
  mutation UpdateBattleCards($where: BattleCardWhere!, $update: BattleCardUpdateInput) {
    updateBattleCards(where: $where, update: $update) {
      battleCards {
        order
        uuid
        title
        src
        dancers {
          uuid
          email
          displayName
        }
        winners {
          uuid
          email
          displayName
        }
      }
    }
  }
`;

export const CREATE_WORKSHOP_CARD = gql`
  mutation CreateWorkshopCards($input: [WorkshopCardCreateInput!]!) {
    createWorkshopCards(input: $input) {
      workshopCards {
        uuid
        order
        title
        cost
        date
        address
        image
        recapSrc
        teachers {
          uuid
          email
          displayName
        }
        styles {
          name
        }
      }
    }
  }
`;

export const DELETE_WORKSHOP_CARD = gql`
  mutation DeleteWorkshopCards($where: WorkshopCardWhere!) {
    deleteWorkshopCards(where: $where) {
      nodesDeleted
      relationshipsDeleted
    }
  }
`;

export const UPDATE_WORKSHOP_CARD = gql`
  mutation UpdateWorkshopCards($where: WorkshopCardWhere!, $update: WorkshopCardUpdateInput) {
    updateWorkshopCards(where: $where, update: $update) {
      workshopCards {
        uuid
        order
        title
        cost
        date
        address
        image
        recapSrc
        teachers {
          uuid
          email
          displayName
        }
        styles {
          name
        }
      }
    }
  }
`;

export const UPDATE_WORKSHOP_SECTION = gql`
  mutation UpdateSections($where: SectionWhere!, $update: SectionUpdateInput) {
    updateSections(where: $where, update: $update) {
      sections {
        order
        uuid
        type
        workshopCardsIn {
          uuid
          order
          title
          cost
          date
          address
          image
          recapSrc
          styles {
            name
          }
          teachers {
            uuid
            email
            displayName
          }
        }
      }
    }
  }
`;

export const DELETE_PERFORMANCE_CARD = gql`
  mutation DeletePerformanceCards($where: PerformanceCardWhere!) {
    deletePerformanceCards(where: $where) {
      nodesDeleted
      relationshipsDeleted
    }
  }
`;

export const UPDATE_PERFORMANCE_CARD = gql`
  mutation UpdatePerformanceCards(
    $where: PerformanceCardWhere!
    $update: PerformanceCardUpdateInput
  ) {
    updatePerformanceCards(where: $where, update: $update) {
      performanceCards {
        uuid
        order
        title
        src
        dancers {
          uuid
          email
          displayName
        }
      }
    }
  }
`;

export const CREATE_PERFORMANCE_CARD = gql`
  mutation CreatePerformanceCards($input: [PerformanceCardCreateInput!]!) {
    createPerformanceCards(input: $input) {
      performanceCards {
        uuid
        order
        title
        src
        dancers {
          uuid
          email
          displayName
        }
      }
    }
  }
`;

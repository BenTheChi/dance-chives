import { gql } from '@apollo/client';

// export const getAllUsers = gql`
//   query GetAllUsers {
//     users {
//       username
//       displayName
//     }
//   }
// `;

export const getUsers = (keyword: string) => gql`
  query GetUsers {
    users(where: { displayName_CONTAINS: "${keyword}" }) {
      username
      displayName
    }
  }
`;

export const getUser = (username: string) => gql`
  query GetUser {
    users(where: { username: "${username}" }) {
      uuid
      username
      displayName
      email
      fname
      lname
      dob
      createdAt
      auth
      aboutMe
      image
      socials
      city
      styles
    }
  }
`;

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
      displayName
      username
    }
    mcs {
      displayName
      username
    }
    djs {
      displayName
      username
    }
    videographers {
      displayName
      username
    }
    graphicDesigners {
      displayName
      username
    }
    photographers {
      displayName
      username
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
        username
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
            username
            displayName
          }
          winners {
            username
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
          username
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
          username
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
          username
          displayName
        }
        djs {
          username
          displayName
        }
        mcs {
          username
          displayName
        }
        videographers {
          username
          displayName
        }
        photographers {
          username
          displayName
        }
        graphicDesigners {
          username
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
          username
          displayName
        }
        djs {
          username
          displayName
        }
        mcs {
          username
          displayName
        }
        videographers {
          username
          displayName
        }
        photographers {
          username
          displayName
        }
        graphicDesigners {
          username
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
          username
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
              username
              displayName
            }
            winners {
              username
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
            username
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
            username
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
          username
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
              username
              displayName
            }
            winners {
              username
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
            username
            displayName
          }
          winners {
            username
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
          username
          displayName
        }
        winners {
          username
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
          username
          displayName
        }
        winners {
          username
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
          username
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
          username
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
            username
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
          username
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
          username
          displayName
        }
      }
    }
  }
`;

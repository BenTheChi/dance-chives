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
      bracketsIn {
        type
        order
        battleCardsIn {
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
      uuid
      type
      performanceCardsIn {
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
      uuid
      type
      workshopCardsIn {
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

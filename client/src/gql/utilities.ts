import { UserBasicInfo } from '@/types/types';

export const createListOfRoles = (users: UserBasicInfo[]) => {
  return users.map((user) => {
    return {
      where: {
        node: {
          username: user.username,
        },
      },
    };
  });
};

export const createConnectOrCreateListOfStyles = (styles: String[]) => {
  return styles.map((style) => {
    return {
      where: {
        node: {
          name: style,
        },
      },
      onCreate: {
        node: {
          name: style,
        },
      },
    };
  });
};

export const createCreateListOfBrackets = (brackets: any) => {
  return brackets.map((bracket: { uuid: string; type: string; order: number }) => {
    return {
      node: { uuid: bracket.uuid, type: bracket.type, order: bracket.order.toString() },
    };
  });
};

export const createDeleteListOfBrackets = (uuids: string[]) => {
  return uuids.map((uuid) => {
    return {
      where: { node: { uuid: uuid } },
    };
  });
};

export const createDeleteListOfRoles = (people: string[]) => {
  return people.map((person) => {
    return {
      where: {
        node: {
          username: person,
        },
      },
    };
  });
};

export const createDeleteListOfStyles = (styles: string[]) => {
  return styles.map((style) => {
    return {
      where: {
        node: {
          name: style,
        },
      },
    };
  });
};

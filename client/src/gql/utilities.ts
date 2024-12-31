export const createConnectOrCreateListOfRoles = (people: String[]) => {
  return people.map((person) => {
    return {
      where: {
        node: {
          displayName: person,
        },
      },
      onCreate: {
        node: {
          uuid: crypto.randomUUID(),
          email: '',
          displayName: person,
          dob: '0',
          name: '',
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

// export const createUpdateOfBracket = (bracket: any) => {
//   return {
//     where: {
//       node: {
//         uuid: bracket.uuid,
//       },
//     },
//     update: {
//       node: {
//         type: bracket.type,
//         order: bracket.order.toString(),
//       },
//     },
//   };
// };

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
          displayName: person,
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
// export const updateListofBrackets = (brackets: any) => {
//     return brackets.map((bracket: {uuid: string, type: string, order: number}) => {
//         return {
//             where: {
//                 uuid: bracket.uuid
//             }
//             update: {}
//         }
//     })
// }

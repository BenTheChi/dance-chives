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

import driver from "../driver";

export const getUser = async (id: string) => {
  const session = driver.session();
  const result = await session.run("MATCH (u:User {id: $id}) RETURN u", {
    id,
  });
  session.close();
  return result.records[0].get("u").properties;
};

export const getUsers = async (keyword: string | null) => {
  const session = driver.session();
  let result;

  if (keyword) {
    result = await session.run(
      `
      MATCH (u:User)
      WHERE toLower(u.username) CONTAINS toLower($keyword)
         OR toLower(u.displayName) CONTAINS toLower($keyword)
      RETURN u
      `,
      { keyword }
    );
  } else {
    result = await session.run(
      `
      MATCH (u:User)
      RETURN u
      `
    );
  }

  session.close();

  // return all properties from each user node
  return result.records.map((record) => record.get("u").properties);
};

export const signupUser = async (
  id: string,
  user: { displayName: string; username: string; date: string; auth?: string }
) => {
  const session = driver.session();
  const result = await session.run(
    "MERGE (u:User {id: $id}) ON CREATE SET u.displayName = $user.displayName, u.username = $user.username, u.date = $user.date, u.auth = $user.auth RETURN u",
    { id, user }
  );
  session.close();
  return result.records[0].get("u");
};

export const updateUser = async (id: string, user: { [key: string]: any }) => {
  const session = driver.session();
  const result = await session.run(
    "MATCH (u:User {id: $id}) SET u = $user RETURN u",
    { id, user }
  );
  session.close();
  return result.records[0].get("u").properties;
};

//OTHER QUERIES HERE

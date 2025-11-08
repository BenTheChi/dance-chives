import driver from "../driver";
import { normalizeStyleNames } from "@/lib/utils/style-utils";

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
  user: {
    displayName: string;
    username: string;
    date: string;
    city: string;
    styles?: string[];
  }
) => {
  const session = driver.session();
  try {
    // Create/update user
    const result = await session.run(
      "MERGE (u:User {id: $id}) ON CREATE SET u.displayName = $user.displayName, u.username = $user.username, u.date = $user.date, u.city = $user.city RETURN u",
      { id, user }
    );

    // Create Style nodes and relationships if styles are provided
    if (user.styles && user.styles.length > 0) {
      const normalizedStyles = normalizeStyleNames(user.styles);
      await session.run(
        `
        MATCH (u:User {id: $id})
        WITH u, $styles AS styles
        UNWIND styles AS styleName
        MERGE (s:Style {name: styleName})
        MERGE (u)-[:STYLE]->(s)
        `,
        { id, styles: normalizedStyles }
      );
    }

    return result.records[0].get("u");
  } finally {
    session.close();
  }
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

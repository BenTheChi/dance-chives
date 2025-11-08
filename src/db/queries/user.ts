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

export const getUserByUsername = async (username: string) => {
  const session = driver.session();
  try {
    const result = await session.run(
      "MATCH (u:User {username: $username}) RETURN u",
      { username }
    );
    if (result.records.length === 0) {
      return null;
    }
    return result.records[0].get("u").properties;
  } finally {
    session.close();
  }
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
    bio?: string | null;
    instagram?: string | null;
    website?: string | null;
    image?: string | null;
  }
) => {
  const session = driver.session();
  try {
    // Build SET clause dynamically to only set properties that are provided
    const setClauses: string[] = [
      "u.displayName = $user.displayName",
      "u.username = $user.username",
      "u.date = $user.date",
      "u.city = $user.city",
    ];

    if (user.bio !== undefined) {
      setClauses.push("u.bio = $user.bio");
    }
    if (user.instagram !== undefined) {
      setClauses.push("u.instagram = $user.instagram");
    }
    if (user.website !== undefined) {
      setClauses.push("u.website = $user.website");
    }
    if (user.image !== undefined) {
      setClauses.push("u.image = $user.image");
    }

    const setClause = setClauses.join(", ");

    // Create/update user
    const result = await session.run(
      `MERGE (u:User {id: $id}) ON CREATE SET ${setClause} RETURN u`,
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

export const updateUser = async (
  id: string,
  user: { [key: string]: any },
  styles?: string[]
) => {
  const session = driver.session();
  try {
    // Update user properties
    const result = await session.run(
      "MATCH (u:User {id: $id}) SET u = $user RETURN u",
      { id, user }
    );

    // Handle style relationships if provided
    if (styles !== undefined) {
      // Remove all existing STYLE relationships
      await session.run(
        `
        MATCH (u:User {id: $id})-[r:STYLE]->(s:Style)
        DELETE r
        `,
        { id }
      );

      // Create new STYLE relationships if styles are provided
      if (styles.length > 0) {
        const normalizedStyles = normalizeStyleNames(styles);
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
    }

    return result.records[0].get("u").properties;
  } finally {
    session.close();
  }
};

export const getUserWithStyles = async (id: string) => {
  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (u:User {id: $id})
      OPTIONAL MATCH (u)-[:STYLE]->(s:Style)
      RETURN u, collect(s.name) as styles
      `,
      { id }
    );

    if (result.records.length === 0) {
      return null;
    }

    const record = result.records[0];
    const user = record.get("u").properties;
    const styles = record.get("styles") || [];

    return {
      ...user,
      styles: styles.filter((s: any) => s !== null),
    };
  } finally {
    session.close();
  }
};

export const getUserEvents = async (id: string) => {
  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (u:User {id: $id})-[:CREATED]->(e:Event)
      RETURN e.id as eventId, e.title as eventTitle, e.createdAt as createdAt
      ORDER BY e.createdAt DESC
      `,
      { id }
    );

    return result.records.map((record) => ({
      eventId: record.get("eventId"),
      eventTitle: record.get("eventTitle") || "Untitled Event",
      createdAt: record.get("createdAt"),
    }));
  } finally {
    session.close();
  }
};

//OTHER QUERIES HERE

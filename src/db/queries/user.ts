import driver from "../driver";
import { normalizeStyleNames } from "@/lib/utils/style-utils";
import { City } from "@/types/city";

export interface UpdateUserInput {
  id?: string;
  username?: string;
  displayName?: string;
  date?: string;
  city?: City | string;
  bio?: string | null;
  instagram?: string | null;
  website?: string | null;
  image?: string | null;
  avatar?: string | null;
  [key: string]: unknown; // Allow additional properties for flexibility
}

export const getUser = async (id: string) => {
  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (u:User {id: $id})
      OPTIONAL MATCH (u)-[:LOCATED_IN]->(c:City)
      RETURN u, c as city
      `,
      { id }
    );

    if (result.records.length === 0) {
      return null;
    }

    const record = result.records[0];
    const user = record.get("u").properties;
    const cityNode = record.get("city");

    // Convert city node to City object if it exists
    let city: City | null = null;
    if (cityNode) {
      city = {
        id: cityNode.properties.id,
        name: cityNode.properties.name,
        region: cityNode.properties.region || "",
        countryCode: cityNode.properties.countryCode || "",
        population: cityNode.properties.population || 0,
        timezone: cityNode.properties.timezone,
      };
    }

    return {
      ...user,
      city: city,
    };
  } finally {
    session.close();
  }
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
    city: City | string;
    styles?: string[];
    bio?: string | null;
    instagram?: string | null;
    website?: string | null;
    image?: string | null;
    avatar?: string | null;
  }
) => {
  const session = driver.session();
  try {
    // Parse city if it's a string (legacy support)
    let cityData: City;
    if (typeof user.city === "string") {
      try {
        cityData = JSON.parse(user.city);
      } catch {
        // If parsing fails, create a minimal city object from string
        // This handles legacy data where city was just a name
        cityData = {
          id: 0,
          name: user.city,
          region: "",
          countryCode: "",
          population: 0,
        };
      }
    } else {
      cityData = user.city;
    }

    // Build SET clause dynamically to only set properties that are provided
    const setClauses: string[] = [
      "u.displayName = $user.displayName",
      "u.username = $user.username",
      "u.date = $user.date",
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
    if (user.avatar !== undefined) {
      setClauses.push("u.avatar = $user.avatar");
    }

    const setClause = setClauses.join(", ");

    // Create/update user and connect to City node
    const result = await session.run(
      `
      MERGE (u:User {id: $id})
      ON CREATE SET ${setClause}
      WITH u
      MERGE (c:City {id: $city.id})
      ON CREATE SET 
        c.name = $city.name,
        c.countryCode = $city.countryCode,
        c.region = $city.region,
        c.population = $city.population,
        c.timezone = $city.timezone
      ON MATCH SET
        c.population = $city.population
      MERGE (u)-[:LOCATED_IN]->(c)
      RETURN u
      `,
      {
        id,
        user: {
          displayName: user.displayName,
          username: user.username,
          date: user.date,
          bio: user.bio,
          instagram: user.instagram,
          website: user.website,
          image: user.image,
          avatar: user.avatar,
        },
        city: cityData,
      }
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
  user: UpdateUserInput,
  styles?: string[]
) => {
  const session = driver.session();
  try {
    // Extract city from user object if present
    let cityData: City | null = null;
    const userWithoutCity = { ...user };

    if (user.city) {
      if (typeof user.city === "string") {
        try {
          cityData = JSON.parse(user.city);
        } catch {
          // If parsing fails, skip city update
          console.warn("Failed to parse city data, skipping city update");
        }
      } else if (typeof user.city === "object" && user.city.id) {
        cityData = user.city as City;
      }
      delete userWithoutCity.city;
    }

    // Update user properties (excluding city)
    const result = await session.run(
      "MATCH (u:User {id: $id}) SET u = $user RETURN u",
      { id, user: userWithoutCity }
    );

    // Update city relationship if city data is provided
    if (cityData) {
      await session.run(
        `
        MATCH (u:User {id: $id})
        OPTIONAL MATCH (u)-[r:LOCATED_IN]->(oldCity:City)
        DELETE r
        WITH u
        MERGE (c:City {id: $city.id})
        ON CREATE SET 
          c.name = $city.name,
          c.countryCode = $city.countryCode,
          c.region = $city.region,
          c.population = $city.population,
          c.timezone = $city.timezone
        ON MATCH SET
          c.population = $city.population
        MERGE (u)-[:LOCATED_IN]->(c)
        `,
        { id, city: cityData }
      );
    }

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
      OPTIONAL MATCH (u)-[:LOCATED_IN]->(c:City)
      RETURN u, collect(s.name) as styles, c as city
      `,
      { id }
    );

    if (result.records.length === 0) {
      return null;
    }

    const record = result.records[0];
    const user = record.get("u").properties;
    const styles = record.get("styles") || [];
    const cityNode = record.get("city");

    // Convert city node to City object if it exists
    let city: City | null = null;
    if (cityNode) {
      city = {
        id: cityNode.properties.id,
        name: cityNode.properties.name,
        region: cityNode.properties.region || "",
        countryCode: cityNode.properties.countryCode || "",
        population: cityNode.properties.population || 0,
        timezone: cityNode.properties.timezone,
      };
    }

    return {
      ...user,
      styles: styles.filter((s: string) => s !== null),
      city: city,
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

export const getAllUsers = async () => {
  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (u:User)
      OPTIONAL MATCH (u)-[:LOCATED_IN]->(c:City)
      OPTIONAL MATCH (u)-[:STYLE]->(s:Style)
      RETURN u.id as id, u.displayName as displayName, u.username as username,
             u.image as image, c.name as cityName, c.id as cityId,
             collect(DISTINCT s.name) as styles
      ORDER BY u.displayName ASC, u.username ASC
      `
    );

    await session.close();

    return result.records.map((record) => ({
      id: record.get("id"),
      displayName: record.get("displayName") || "",
      username: record.get("username") || "",
      image: record.get("image"),
      city: record.get("cityName") || null,
      cityId: record.get("cityId") || null,
      styles: (record.get("styles") || []).filter(
        (s: string) => s !== null && s !== undefined
      ) as string[],
    }));
  } catch (error) {
    console.error("Error fetching all users:", error);
    await session.close();
    return [];
  }
};

//OTHER QUERIES HERE

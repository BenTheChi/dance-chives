import driver from "../driver";
import { normalizeStyleNames } from "@/lib/utils/style-utils";
import { City } from "@/types/city";
import { generateCitySlug } from "@/lib/utils/city-slug";

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
  claimed?: boolean;
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
        id: String(cityNode.properties.id),
        name: cityNode.properties.name,
        region: cityNode.properties.region || "",
        countryCode: cityNode.properties.countryCode || "",
        timezone: cityNode.properties.timezone || undefined,
        latitude: cityNode.properties.latitude
          ? Number(cityNode.properties.latitude)
          : undefined,
        longitude: cityNode.properties.longitude
          ? Number(cityNode.properties.longitude)
          : undefined,
        slug: cityNode.properties.slug || undefined,
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
         OR toLower(u.instagram) CONTAINS toLower($keyword)
      RETURN u
      ORDER BY coalesce(u.claimed, true) DESC, u.displayName ASC
      `,
      { keyword }
    );
  } else {
    result = await session.run(
      `
      MATCH (u:User)
      RETURN u
      ORDER BY coalesce(u.claimed, true) DESC, u.displayName ASC
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
    claimed?: boolean;
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
          id: "",
          name: user.city,
          region: "",
          countryCode: "",
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
      "u.claimed = coalesce($user.claimed, true)",
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

    // Generate slug for city if not provided
    const citySlug = cityData.slug || generateCitySlug(cityData);

    // Create/update user and connect to City node
    const result = await session.run(
      `
      MERGE (u:User {id: $id})
      SET ${setClause}
      WITH u
      MERGE (c:City {id: $city.id})
      ON CREATE SET 
        c.name = $city.name,
        c.countryCode = $city.countryCode,
        c.region = $city.region,
        c.timezone = $city.timezone,
        c.latitude = $city.latitude,
        c.longitude = $city.longitude,
        c.slug = $citySlug
      ON MATCH SET
        c.name = $city.name,
        c.countryCode = $city.countryCode,
        c.region = $city.region,
        c.timezone = $city.timezone,
        c.latitude = $city.latitude,
        c.longitude = $city.longitude,
        c.slug = $citySlug
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
          claimed: user.claimed,
        },
        city: cityData,
        citySlug: citySlug,
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
          c.timezone = $city.timezone,
          c.latitude = $city.latitude,
          c.longitude = $city.longitude
        ON MATCH SET
          c.name = $city.name,
          c.countryCode = $city.countryCode,
          c.region = $city.region,
          c.timezone = $city.timezone,
          c.latitude = $city.latitude,
          c.longitude = $city.longitude
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
        id: String(cityNode.properties.id),
        name: cityNode.properties.name,
        region: cityNode.properties.region || "",
        countryCode: cityNode.properties.countryCode || "",
        timezone: cityNode.properties.timezone || undefined,
        latitude: cityNode.properties.latitude
          ? Number(cityNode.properties.latitude)
          : undefined,
        longitude: cityNode.properties.longitude
          ? Number(cityNode.properties.longitude)
          : undefined,
        slug: cityNode.properties.slug || undefined,
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

/**
 * Delete a user and all their relationships from Neo4j
 * This function handles cleanup of all user relationships before deleting the user node
 * Note: Events should be handled separately (either deleted or transferred)
 * Uses DETACH DELETE to ensure all relationships are removed
 */
export const deleteUser = async (userId: string): Promise<void> => {
  const session = driver.session();
  try {
    // Use DETACH DELETE to remove all relationships and the node in one operation
    // This is safer and more comprehensive than manually deleting relationships
    await session.run(
      `
      MATCH (u:User {id: $userId})
      DETACH DELETE u
      `,
      { userId }
    );
  } finally {
    session.close();
  }
};

//OTHER QUERIES HERE

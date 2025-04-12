import { User } from "@/types/user";
import driver from "../driver";

export const getUser = async (id: string) => {
  const session = driver.session();
  const result = await session.run("MATCH (u:User {id: $id}) RETURN u", { id });
  session.close();
  return result.records[0].get("u").properties;
};


export const signupUser = async (id: string, user: { displayName: string, username: string, date: string, auth?: string }) => {

  const session = driver.session();
  const result = await session.run(
    "MATCH (u:User {id: $id}) SET u.displayName = $user.displayName, u.username = $user.username, u.date = $user.date, u.auth = $user.auth RETURN u",
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

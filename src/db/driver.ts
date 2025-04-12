import neo4j from "neo4j-driver";

const driver = neo4j.driver(
  process.env.NEO4J_URI ||
    (() => {
      throw new Error("NEO4J_URI is not defined");
    })(),
  neo4j.auth.basic(
    process.env.NEO4J_USERNAME ||
      (() => {
        throw new Error("NEO4J_USERNAME is not defined");
      })(),
    process.env.NEO4J_PASSWORD ||
      (() => {
        throw new Error("NEO4J_PASSWORD is not defined");
      })()
  )
);

export default driver;

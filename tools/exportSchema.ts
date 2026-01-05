import "dotenv/config";
import fs from "fs";
import { printSchema } from "graphql";
import { schema } from "../src/builder";

const main = async () => {
  fs.writeFileSync("./document/schema.graphql", printSchema(schema));
};

main();

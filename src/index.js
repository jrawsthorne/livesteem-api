import {ApolloServer} from "apollo-server-express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import {mergeSchemas} from "graphql-tools";
import http from "http";
import customResolvers from "./customResolvers";
import customTypes from "./customTypes";
import {getRemoteSchema} from "./utils";

dotenv.config();

const runServer = async () => {
  const steemSchema = await getRemoteSchema(
    "https://hivemind-graphql.jakerawsthorne.co.uk/v1alpha1/graphql"
  );

  // merge custom resolvers with Hasura schema
  const finalSchema = mergeSchemas({
    schemas: [steemSchema, customTypes],
    resolvers: [customResolvers]
  });

  const apolloServer = new ApolloServer({
    schema: finalSchema,
    context: ({req, res}) => ({req, res, steemSchema}),
    playground: {
      subscriptionEndpoint: "/"
    },
    subscriptions: {
      path: "/"
    },
    introspection: true
  });

  const app = express();

  app.use(cookieParser());

  app.use(
    cors({
      credentials: true,
      origin: process.env.APP_URL || "http://localhost:3000"
    })
  );

  apolloServer.applyMiddleware({app, path: "/", cors: false});

  const httpServer = http.createServer(app);
  apolloServer.installSubscriptionHandlers(httpServer);

  const port = 4000;

  // ⚠️ Pay attention to the fact that we are calling `listen` on the http server variable, and not on `app`.
  httpServer.listen(port, () => {
    console.log(
      `🚀 Server with Apollo Server is running on http://localhost:${port}`
    );
  });
};

try {
  runServer();
} catch (e) {
  console.log(e, e.message, e.stack);
}

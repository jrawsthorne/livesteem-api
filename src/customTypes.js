import {gql} from "apollo-server";

const customTypes = gql`
  extend type Query {
    me: accounts
  }
  type Mutation {
    verifyLogin(username: String!): String!
  }
`;

export default customTypes;

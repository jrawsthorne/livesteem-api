import {UserInputError} from "apollo-server";
import jwt from "jsonwebtoken";
import steem from "steem";

const customResolvers = {
  Query: {
    me: async (_, __, context, info) => {
      if (
        !context.req ||
        !context.req.headers ||
        !context.req.headers.authorization
      ) {
        return null;
      }

      const accessToken = context.req.headers.authorization.split(" ")[1];

      if (!accessToken) {
        return null;
      }

      try {
        const {username} = jwt.verify(accessToken, process.env.JWT_SECRET);
        const [account] = await info.mergeInfo.delegateToSchema({
          schema: context.steemSchema,
          operation: "query",
          fieldName: "accounts",
          args: {
            where: {
              name: {
                _eq: username
              }
            }
          },
          context,
          info
        });
        return account;
      } catch {
        return null;
      }
    }
  },
  Mutation: {
    verifyLogin: async (_, {username}) => {
      const [account] = await steem.api.getAccountsAsync([username]);
      if (!account) {
        throw new UserInputError(
          "An account with that username couldn't be found"
        );
      }

      const token = jwt.sign(
        {
          username: account.name,
          date: Date.now()
        },
        process.env.JWT_SECRET,
        {expiresIn: "7d"}
      );

      const encryptedToken = steem.memo.encode(
        process.env.STEEM_WIF,
        account.memo_key,
        `#${token}`
      );

      return encryptedToken;
    }
  }
};

export default customResolvers;

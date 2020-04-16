const fs = require('fs');
const { Pool } = require('pg');
const pgQuery = fs.readFileSync('server/queries/tableData.sql', 'utf8');
const pgController = {};
const {
  createQuery,
  createMutation,
  createTypes,
  formatTypeDefs,
} = require('./../helpers/typesCreator');
const {
  generateGetAllQuery,
  generateGetOneQuery,
  generateQueryResolvers,
  generateMutationResolvers,
  formatResolvers,
} = require('./../helpers/resolversCreator');
const {
  generateMutations,
  assembleMutations,
  formatMutations,
} = require('../programmatically-definedSchemas/helpers/mutationCreator');

// middleware function for recovering info from pg tables
pgController.getPGTables = (req, res, next) => {
  const db = new Pool({ connectionString: req.query.uri });
  db.query(pgQuery)
    .then((data) => {
      res.locals.tables = data.rows[0].tables;
      return next();
    })
    .catch((err) =>
      next({
        log: 'There was a problem making database query',
        status: 500,
        message: { err },
      }),
    );
};

// middleware function for making query root types in SDL
pgController.makeQueries = (req, res, next) => {
  let queries = createQuery(res.locals.tables);
  res.locals.queries = queries;
  return next();
};

// middleware function for making mutation root types in SDL
pgController.makeMutations = (req, res, next) => {
  let mutations = createMutation(res.locals.tables);
  res.locals.mutations = mutations;
  return next();
};

// middleware function for making custom object types in SDL
pgController.makeTypes = (req, res, next) => {
  const types = createTypes(res.locals.tables);
  res.locals.types = types;
  return next();
};

// middleware function for returning formatted type definitions in SDL as string
pgController.returnTypeDefs = (req, res, next) => {
  const { queries, mutations, types } = res.locals;
  res.locals.allTypeDefs = formatTypeDefs(queries, mutations, types);
  return next();
};

// middleware function for making query resolvers in SDL as string
pgController.makeQueryResolvers = (req, res, next) => {
  const queryAllResolvers = generateGetAllQuery(res.locals.tables);
  const queryOneResolvers = generateGetOneQuery(res.locals.tables);
  res.locals.queryResolvers = generateQueryResolvers(
    queryAllResolvers,
    queryOneResolvers
  );
  return next();
};

// middleware function for making mutation resolvers in SDL as string
pgController.makeMutationResolvers = (req, res, next) => {
  const mutationResolvers = generateMutationResolvers(res.locals.tables);
  res.locals.mutationResolvers = mutationResolvers;
  return next();
};

// middleware function for returning formatted resolvers in SDL as string
pgController.returnResolvers = (req, res, next) => {
  const { queryResolvers, mutationResolvers } = res.locals;
  res.locals.resolvers = formatResolvers(queryResolvers, mutationResolvers);
  return next();
};

pgController.assembleSchema = (req, res, next) => {
  const { allTypeDefs, resolvers } = res.locals;
  res.locals.schema = `${allTypeDefs}${resolvers}\n\nconst schema = makeExecutableSchema({\n  typeDefs,\n  resolvers,\n});\n\nmodule.exports = schema;`;
  return next();
};

/////// MUTATIONS - PROGRAMMATIC

pgController.generateMutations = (req, res, next) => {
  try {
    const mutationsArr = generateMutations(res.locals.tables);
    res.locals.mutations = mutationsArr;
    return next();
  } catch (err) {
    return next({
      log: 'There was a problem generating mutations',
      status: 500,
      message: { error: 'Problem generating mutations' },
    });
  }
};

pgController.assembleMutations = (req, res, next) => {
  const mutations = assembleMutations(res.locals.mutations);
  res.locals.mutations = mutations;
  return next();
};

pgController.formatMutations = (req, res, next) => {
  const formattedMutations = formatMutations(res.locals.mutations);
  res.locals.mutations = formattedMutations;
  return next();
};

module.exports = pgController;
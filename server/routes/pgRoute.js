const router = require('express').Router();
const pgController = require('../SDL-definedSchemas/controllers-SDL/pgController');
const pgProgController = require('../programmatically-definedSchemas/controllers-prog/pg-progController')

router.get('/pg-sdl',
  pgController.getPGTables,
  pgController.makeQueries,
  pgController.makeMutations,
  pgController.makeTypes,
  pgController.returnTypeDefs,
  pgController.makeQueryResolvers,
  pgController.makeMutationResolvers,
  pgController.returnResolvers,
  pgController.assembleSchema,
  (req, res) => {
    console.log(res.locals.schema);
    res.status(200).json(res.locals.schema);
  }
);

router.get('/pg-prog',
  pgProgController.getPGTables,
  pgProgController.makeProgQueryResolvers,
  (req, res) => {
    console.log(res.locals.schema);
    res.status(200).json(res.locals.schema);
  }
);

router.get('/mongo-sdl',
  mongoController.getGetCollections,
  (req, res) => {
    console.log(res.locals.schema);
    res.status(200).json(res.locals.schema);
  }
);

module.exports = router;

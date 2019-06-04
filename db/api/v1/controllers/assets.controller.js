const assetsDb = require('../db/assets.db');
const utils = require('../utils');

const find = async (req, res, next) => {
    const projectIdString = req.query['project_id'];
    const projectId = utils.db.parseKey('project_id', projectIdString, res);

    try {
        const assets = await assetsDb.find(projectId);
        res.json(assets);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    find
};
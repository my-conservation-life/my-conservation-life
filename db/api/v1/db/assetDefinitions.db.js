const utils = require('../utils');

const getAssetTypes = async () => {
    try {
        let query = `
            SELECT
                id,
                name,
                description
            FROM
                asset_type
        `;

        return pool.query(query);
    } catch (error) {
        return utils.db.createErrorMessage(error);
    }
};

const getAssetProperties = async () => {
    try {
        let query = `
            SELECT
                asset_type_id,
                name,
                data_type,
                required,
                is_private
            FROM
                property
        `;

        return pool.query(query);
    } catch (error) {
        return utils.db.createErrorMessage(error);
    }
};

const createAssetType = async (client, name, description) => {
    const query = `
        INSERT INTO asset_type
            (name, description)
        VALUES
            ($1, $2)
        RETURNING id
    `;
    const values = [name, description];

    return client.query(query, values);
};

const createProperty = async (client, assetTypeId, property) => {
    const query = `
        INSERT INTO property
            (asset_type_id, name, data_type, required, is_private)
        VALUES
            ($1, $2, $3, $4, $5)
    `;
    const values = [assetTypeId, property.name, property.data_type, property.required, property.is_private];

    return client.query(query, values);
};

const getAll = async () => {

    const types = (await getAssetTypes()).rows;
    const properties = (await getAssetProperties()).rows;

    const assetDefinitions = [];
    for (let type of types) {
        const assetDefinition = {
            assetType: type,
            properties: []
        };
        for (let property of properties) {
            if (type.id === property.asset_type_id) {
                assetDefinition.properties.push(property);
            }
        }
        assetDefinitions.push(assetDefinition);
    }

    return assetDefinitions;
};

const create = async (assetDefinition) => {
    const client = await pool.connect();

    try {
        await utils.db.beginTransaction(client);

        const data = await createAssetType(client, assetDefinition.name, assetDefinition.description);
        const assetTypeId = data.rows[0].id;

        const propertyPromises = [];
        for (let property of assetDefinition.properties) {
            const propertyPromise = createProperty(client, assetTypeId, property);
            propertyPromises.push(propertyPromise);
        }

        await Promise.all(propertyPromises);
        await utils.db.commitTransaction(client);

        return assetTypeId;
    } catch (error) {
        await utils.db.rollbackTransaction(client); //TODO: could fail, needs catch
        return utils.db.createErrorMessage(error);
    } finally {
        client.release();
    }
};

module.exports = {
    getAll,
    create
};
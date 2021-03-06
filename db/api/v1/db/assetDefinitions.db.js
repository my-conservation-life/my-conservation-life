const utils = require('../utils');

const PROPERTIES_QUERY = `
    SELECT
        id,
        asset_type_id,
        name,
        data_type,
        required,
        is_private
    FROM
        property
`;

/**
 * Gets all properties stored in the database
 * 
 * @returns {object} contains all properties found in the database along with other data associated with the query
 */
const findProperties = async () => {
    let query = PROPERTIES_QUERY;

    return global.dbPool.query(query);
};

/**
 * Query to find all asset types.
 */
const findAssetTypes = async () => {
    let query = `
        SELECT
            id,
            name,
            description
        FROM
            asset_type
        ORDER BY id
    `;

    return global.dbPool.query(query);
};

/**
 * Query to find all property types for a given assetTypeID.
 * @param {number} assetTypeID - the asset type ID
 */
const findAllAssetPropTypes = async (assetTypeID) => {
    let query = PROPERTIES_QUERY;
    query = query + `
        WHERE
            asset_type_id = $1
        ORDER BY
            id
    `;

    const params = [assetTypeID];

    return global.dbPool.query(query, params);
};

/**
 * Query to find the non-private property types for a given assetTypeID.
 * @param {number} assetTypeID - the asset type ID
 */
const findNonPrivateAssetPropTypes = async (assetTypeID) => {
    let query = PROPERTIES_QUERY;
    query = query + `
        WHERE
            asset_type_id = $1
        AND
            is_private = false
        ORDER BY
            id
    `;

    const params = [assetTypeID];

    return global.dbPool.query(query, params);
};

/**
 * Finds all asset properties for all assets for a given asset type ID.
 * @param {number} assetTypeID - the asset type ID
 */
const findAssetPropsByTypeID = async (assetTypeID) => {
    let query = `
        SELECT
            asset.id                    AS id,
            ST_X(asset.location)        AS longitude,
            ST_Y(asset.location)        AS latitude,
            asset_property.value        AS value,
            asset_property.property_id  AS property_id,
            property.is_private         AS is_private
        FROM
            asset
            JOIN asset_property     ON asset_property.asset_id = asset.id
            JOIN property           ON asset_property.property_id = property.id
        WHERE
            asset.asset_type_id = $1
        AND
            property.is_private = false
        ORDER BY
            property_id
    `;

    const params = [assetTypeID];

    return global.dbPool.query(query, params);
};

/**
 * Creates an asset type row in the database.
 * 
 * @param {*} client - node postgres client
 * @param {string} name - the asset type's name
 * @param {string} description - the asset type's description
 * @returns {object} an object containing the newly created asset type's id
 */
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

/**
 * Creates a property row in the database based on a asset type's id.
 * 
 * @param {*} client - node postgres client
 * @param {string} assetTypeId - the asset type's id to assign this property to
 * @param {object} property - an object containing name, data_type, required, and is_private
 */
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

const find = async () => {

    const types = (await findAssetTypes()).rows;
    const properties = (await findProperties()).rows;

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

/**
 * Creates a asset definition in the database.
 * Creates asset types and properties within one transaction.
 * 
 * @param {object} assetDefinition - a valid my conservation life asset definition
 */
const create = async (assetDefinition) => {
    const client = await global.dbPool.connect();

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
        await utils.db.rollbackTransaction(client);
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Gets the asset associated given with the asset ID
 * 
 * @param {Number} assetId ID of the asset to query for
 */
const findAsset = async (assetId) => {
    const query = `
        SELECT
            *
        FROM
            asset
        WHERE
            id=$1
    `;

    const values = [assetId];

    return global.dbPool.query(query, values);
};

/**
 * Gets the asset property associated with the given asset ID and property ID
 * 
 * @param {Number} assetId ID of the asset
 * @param {Number} propertyId ID of the property
 */
const findAssetProperty = async (assetId, propertyId) => {
    const query = `
        SELECT 
            *
        FROM
            asset_property
        WHERE
            asset_id=$1 AND 
            property_id=$2
    `;

    const values = [assetId, propertyId];

    return global.dbPool.query(query, values);
};

/**
 * Creates a new asset property in the DB
 * 
 * @param {*} client Node Postgres client
 * @param {Number} assetId asset ID associated with the asset property
 * @param {Number} propertyId property ID associated with the asset property
 * @param {String} value the value of the property 
 */
const createAssetProperty = async (client, assetId, propertyId, value) => {
    
    // Generate the SQL command
    const query = `
        INSERT INTO asset_property
            (asset_id, property_id, value)
        VALUES
            ($1, $2, $3)
    `;

    // Generate the values to subsitute into the SQL command
    const values = [assetId, propertyId, value];

    // Execute the SQL command
    return client.query(query, values);
};

const addAssetPropertyToHistory = async (client, assetId, propertyId, value, date) => {
    // Generate the SQL command
    const query = `
        INSERT INTO history
            (asset_id, property_id, value, date)
        VALUES
            ($1, $2, $3, $4)
    `;

    // Generate the values to subsitute into the SQL command
    const values = [assetId, propertyId, value, date];

    // Execute the SQL command
    return client.query(query, values);
};

/**
 * Updates an asset property that is already stored in the DB
 * 
 * @param {*} client Node Postgres client
 * @param {Number} assetId asset ID associated with the asset property
 * @param {Number} propertyId property ID associated with the asset property
 * @param {String} newValue new value that will replace the asset property's current value
 */
const updateAssetProperty = async(client, assetId, propertyId, newValue) => {

    let query = `
        UPDATE asset_property 
        SET value=$1
        WHERE 
            asset_id=$2 AND 
            property_id=$3
    `;

    const  values = [newValue, assetId, propertyId];

    return client.query(query, values);
};

/**
 * Updates the location of an asset by encoding longitude and latitude coordinates
 * @param {*} client Node Postgres client
 * @param {Number} assetId ID of the asset whose location is to be added/updated
 * @param {Number} longitude Longitude of the asset
 * @param {Number} latitude Latitude of the asset
 */
const addLocation = async(client, assetId, longitude, latitude) => {
    // Generate the SQL command
    const query = `
        UPDATE asset
        SET location=ST_MakePoint($1, $2)
        WHERE id=$3
    `;

    // Generate the values to subsitute into the SQL command
    const values = [longitude, latitude, assetId];

    // Execute the SQL command
    return client.query(query, values);
};

/**
 * Stores contents of CSV into the DB
 * 
 * @param {Number} assetTypeId ID of the asset type associated with the headers in the CSV
 * @param {Object} csvJson JSON of data contained in the imported CSV file
 */
const storeCSV = async(assetTypeId, csvJson) => {
    // Get properties associated with the selected asset type
    const propertyArray = (await findAllAssetPropTypes(assetTypeId)).rows;

    // Create a property object to be more accessible
    const properties = {};
    var i;
    var property = null;
    var propertyName = null;
    for (i = 0; i < propertyArray.length; i++) {
        property = propertyArray[i];
        propertyName = property.name;
        properties[propertyName] = property;
    }

    // Start processing the JSON of the CSV file
    var asset;
    var assetId;
    var propertyId;
    var propertyIsRequired;
    var value;
    const client = await global.dbPool.connect();
    try {
        // Check to see that the CSV has data to store
        if (csvJson.length === 0) {
            throw 'The selected CSV file has no data to import.';
        }

        // Check that asset IDs are specified in the CSV
        asset = csvJson[0];
        if (!('asset_id' in asset)) {
            throw 'The selected CSV file is missing an asset ID column.';
        }

        // Check that latitude and longitude are specified in the CSV
        if (!('latitude' in asset) || !('longitude' in asset)) {
            throw 'The selected CSV file is missing a latitude and/or longitude column';
        }

        // Check that all headers associated with the selected asset type are contained in the CSV
        for (const propertyName in properties) {
            if (!(propertyName in asset)) {
                throw 'The selected CSV file is missing a header (' + propertyName + ')';
            }
        }

        // Validate each row of the CSV and add it
        await utils.db.beginTransaction(client);
        for (i = 0; i < csvJson.length; i++) {
            asset = csvJson[i];
            assetId = asset.asset_id;

            // Check that each row contains an asset ID
            if (assetId === '') {
                throw 'The selected CSV file contains a row that is missing an asset ID (' + JSON.stringify(asset) + ')';
            }

            // Check that the asset exists
            // TODO in the future - Add new asset to DB instead of throwing error 
            const checkedAsset = (await findAsset(assetId)).rows;
            if (checkedAsset.length === 0) {
                throw 'The selected CSV file contains a row for an asset that is not being tracked (Asset ID '+ assetId + ')';
            }
            if (checkedAsset[0].asset_type_id != assetTypeId) {
                throw 'The selected CSV file contains an asset of a different asset type than the one selected (Asset ID '+ assetId + ')';
            }

            for (const propertyName in asset) {
                if (propertyName !== 'asset_id' && propertyName !== 'longitude' && propertyName !== 'latitude') {
                    // Throw an error if CSV contains a header that is not associated with the selected asset type
                    if (!(propertyName in properties)) {
                        throw 'The selected CSV file may contain a property that is not affiliated with the selected asset type. If this is not the case, make sure to check your CSV for irrelevant columns such as blank columns and columns with blank headers. (' + propertyName + ')';
                    }

                    property = properties[propertyName];
                    propertyId = property.id;
                    propertyIsRequired = property.required;
                    value = asset[propertyName];
                    let assetProperties = (await findAssetProperty(assetId, propertyId)).rows;

                    let date = new Date();
                    // Throw an error if a row fails to contain a value for a property that is required
                    if (value === '' && propertyIsRequired) {
                        throw 'The selected CSV file is missing a required value (' + propertyName + ', Asset ID ' + assetId + ')';
                    } else if (value === '') {
                        continue;
                    } else if (assetProperties.length > 0) {
                        if (assetProperties[0].value !== value) {
                            await addAssetPropertyToHistory(client, assetId, propertyId, value, date);
                            await updateAssetProperty(client, assetId, propertyId, value);
                        }
                    } else {
                        await addAssetPropertyToHistory(client, assetId, propertyId, value, date);
                        await createAssetProperty(client, assetId, propertyId, value);
                    }
                }
            }

            // Add location of asset to the DB
            let longitude = parseFloat(asset['longitude']);
            let latitude = parseFloat(asset['latitude']);

            if (isNaN(longitude) || isNaN(latitude)) {
                throw 'The selected CSV file contains a row missing a longitude and/or latitude value (Asset ID ' + assetId + ')';
            }
            await addLocation(client, assetId, longitude, latitude);
        }
        await utils.db.commitTransaction(client);
    }
    catch (error) {
        // If an error is thrown, undo all DB interactions since the transaction began
        await utils.db.rollbackTransaction(client);
        return({success: false, error: error});
    }
    finally {
        client.release();
    }
    return({success: true});
};

module.exports = {
    findAssetTypes,
    findNonPrivateAssetPropTypes,
    findAssetPropsByTypeID,
    find,
    create,
    findAsset,
    findAssetProperty,
    createAssetProperty,
    addAssetPropertyToHistory,
    updateAssetProperty,
    storeCSV
};

/**
 * Tests for Asset Definitions database layer
 */
const { findAssetTypes, findAssetPropTypes, findAsset, findAssetProperty, 
    createAssetProperty, addAssetPropertyToHistory, updateAssetProperty } = require('../assetDefinitions.db');

describe('assetDefinitions.db.findAssetTypes', () => {
    let rows;
    let query;

    beforeEach(() => {
        rows = [{}];
        query = jest.fn(async() => rows);
        global.dbPool = { query };
    });

    it(('returns an array containing all asset types'), async() => {
        const actualRows = await findAssetTypes();
        expect(actualRows).toEqual(rows);
    });
});

describe('assetDefinitions.db.findAssetPropTypes', () => {
    let rows;
    let query;
    let assetTypeId;

    beforeEach(() => {
        rows = [{}];
        query = jest.fn(async() => rows);
        global.dbPool = { query };

        assetTypeId = 1;
    });

    it('finds all properties associated with the asset type ID given', async () => {
        const actualRows = await findAssetPropTypes(assetTypeId);
        expect(actualRows).toEqual(rows);
    });
});

describe('assetDefinitions.db.findAsset', () => {
    let rows;
    let query;
    let assetId;

    beforeEach(() => {
        rows = [{}];
        query = jest.fn(async() => rows);
        global.dbPool = { query };

        assetId = 1;
    });

    it('finds the asset associated with the asset ID given', async () => {
        const actualRows = await findAsset(assetId);
        expect(actualRows).toEqual(rows);
    });
});

describe('assetDefinitions.db.findAssetProperty', () => {
    let rows;
    let query;
    let assetId;
    let propertyId;

    beforeEach(() => {
        rows = [{}];
        query = jest.fn(async() => rows);
        global.dbPool = { query };

        assetId = 1;
        propertyId = 1;
    });

    it('find the asset property associated with the asset type ID and property ID given', async () => {
        const actualRows = await findAssetProperty(assetId, propertyId);
        expect(actualRows).toEqual(rows);
    });
});

describe('assetDefinitions.db.createAssetProperty', () => {
    let rows;
    let query;
    let release;
    let client;

    beforeEach(() => {
        rows = [{}];
        query = jest.fn(async () => ({ rows }));
        release = jest.fn(() => { return undefined; });
        client = { query, release };
        global.dbPool.connect = jest.fn(async () => { return client; });
    });

    it('creates an asset property', async () => {
        const assetId = 1;
        const propertyId = 1;
        const value = 1;
        await createAssetProperty(client, assetId, propertyId, value);
        expect(query).toHaveBeenCalledTimes(1);
    });
});

describe('assetDefinitions.db.addAssetPropertyToHistory', () => {

    let rows;
    let query;
    let release;
    let client;

    beforeEach(() => {
        rows = [{}];
        query = jest.fn(async () => ({ rows }));
        release = jest.fn(() => { return undefined; });
        client = { query, release };
        global.dbPool.connect = jest.fn(async () => { return client; });
    });

    it('adds asset properties to the history table', async() => {
        const assetId = 1;
        const propertyId = 1;
        const value = 1;
        const date = new Date();
        await addAssetPropertyToHistory(client, assetId, propertyId, value, date);
        expect(query).toHaveBeenCalledTimes(1);        
    });
});

describe('assetDefinitions.db.updateAssetProperty', () => {
    let rows;
    let query;
    let release;
    let client;

    beforeEach(() => {
        rows = [{}];
        query = jest.fn(async () => ({ rows }));
        release = jest.fn(() => { return undefined; });
        client = { query, release };
        global.dbPool.connect = jest.fn(async () => { return client; });
    });

    it('updates an asset property', async () => {
        const assetId = 1;
        const propertyId = 1;
        const value = 1;
        await updateAssetProperty(client, assetId, propertyId, value);
        expect(query).toHaveBeenCalledTimes(1);
    });
});

describe('assetDefinitions.db.storeCSV', () => {
    let rows;
    let findAssetPropTypes;
    let findAsset;
    let result;
    let query;
    let release;
    let client;

    beforeEach(() => {
        rows = [{}];
        findAssetPropTypes = jest.fn(async () => ({rows}));
        findAsset = jest.fn(async () => ({rows}));

        result = {};
        query = jest.fn(async () => ( result ));
        release = jest.fn(async () => { return undefined; });
        client = { query, release };
        global.dbPool.connect = jest.fn(async () => { return client; });
    });

    describe('assetDefinitions.db.findAssetTypes', () => {
        let rows;
        let query;

        beforeEach(() => {
            rows = [{}];
            query = jest.fn(async() => rows);
            global.dbPool = { query };
        });

        it('finds all asset types in the database', async () => {
            const actualRows = await findAssetTypes();
            expect(actualRows).toEqual(rows);
        });
    });

    describe('assetDefinitions.db.findAssetPropByTypeID', () => {
        let rows;
        let query;
        let assetTypeId;
    
        beforeEach(() => {
            rows = [{}];
            query = jest.fn(async() => rows);
            global.dbPool = { query };
    
            assetTypeId = 1;
        });
    
        it('finds all properties associated with the asset type ID given', async () => {
            const actualRows = await findAssetPropTypes(assetTypeId);
            expect(actualRows.rows).toEqual(rows);
        });
    });



    // TODO tests for storeCSV function
});

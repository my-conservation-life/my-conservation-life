/**
 * Maximum value supported by the PostgreSQL integer type.
 */
const DB_INTEGER_MAX = 2147483647;

/**
 * Test a given number if it is in the bounds of the PostgreSQL integer type.
 * 
 * @param {number} id - number to check
 * @returns {boolean} true if id is a valid db integer
 */
const isValidDbInteger = (id) => id > 0 && id <= DB_INTEGER_MAX;

/**
 * Begins a SQL transaction
 * 
 * @param {*} client - node postgres client
 * @returns {*} a begin transaction query
 */
const beginTransaction = async (client) => {
    return client.query('BEGIN TRANSACTION');
};

/**
 * Commits a SQL transaction
 * 
 * @param {*} client - node postgres client
 * @returns {*} a commit transaction query
 */
const commitTransaction = async (client) => {
    return client.query('END TRANSACTION');
};

/**
 * Rollsback a SQL transaction
 * 
 * @param {*} client - node postgres client
 * @returns {*} a rollback transaction query
 */
const rollbackTransaction = async (client) => {
    return client.query('ROLLBACK');
};


module.exports = {
    DB_INTEGER_MAX,
    isValidDbInteger,
    beginTransaction,
    commitTransaction,
    rollbackTransaction
};
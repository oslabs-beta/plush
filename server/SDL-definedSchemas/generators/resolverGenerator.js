const { singular } = require('pluralize');
const { toCamelCase } = require('./../helpers/helperFunctions');

const ResolverGenerator = {
  _values: {}
};

ResolverGenerator.queries = function queries(tableName, tableData) {
  const { primaryKey, foreignKeys, columns } = tableData;
  if (!foreignKeys || Object.keys(columns).length !== Object.keys(foreignKeys).length + 1) {
    return `\n${this._columnQuery(tableName, primaryKey)}`
      + `\n${this._allColumnQuery(tableName)}`;
  }
  return '';
};

ResolverGenerator.mutations = function mutations(tableName, tableData) {
  const { primaryKey, foreignKeys, columns } = tableData;
  this._createValues(primaryKey, foreignKeys, columns);
  if (!foreignKeys || Object.keys(columns).length !== Object.keys(foreignKeys).length + 1) {
    return `${this._createMutation(tableName, primaryKey, foreignKeys, columns)}\n`
      + `${this._updateMutation(tableName, primaryKey, foreignKeys, columns)}\n`
      + `${this._deleteMutations(tableName, primaryKey)}\n\n`;
  }
  return '';
};

ResolverGenerator._createValues = function values(primaryKey, foreignKeys, columns) {
  let index = 1;
  for (columnName in columns) {
    if (!(foreignKeys && foreignKeys[columnName]) && columnName !== primaryKey) {
      this._values[index++] = columnName;
    }
  }
  return this._values;
};

ResolverGenerator._columnQuery = function column(tableName, primaryKey) {
  let byID = toCamelCase(singular(tableName));
  if (byID === toCamelCase(tableName)) byID += 'ByID';
  return `    ${byID}: (parent, args) => {\n`
    + '      try{\n'
    + `        const query = 'SELECT * FROM ${tableName} WHERE ${primaryKey} = $1';\n`
    + `        const values = [args.${primaryKey}]\n`
    + '        return db.query(query).then((res) => res.rows)\n'
    + '      } catch (err) {\n'
    + '        throw new Error(err);\n'
    + '      }\n'
    + '    },';
};

ResolverGenerator._allColumnQuery = function allColumn(tableName) {
  return `    ${toCamelCase(tableName)}: () => {\n`
    + '      try {\n'
    + `        const query = 'SELECT * FROM ${tableName}';\n`
    + '        return db.query(query).then((res) => res.rows)\n'
    + '      } catch (err) {\n'
    + '        throw new Error(err);\n'
    + '      }\n'
    + '    },';
};

ResolverGenerator._createMutation = function createColumn(tableName, primaryKey, foreignKeys, columns) {
  return `    ${toCamelCase(`create_${singular(tableName)}`)}: (parent, args) => {\n`
    + `      const query = 'INSERT INTO ${tableName}(${Object.values(this._values).join(', ')}) VALUES(${Object.keys(this._values).map(x => `$${x}`).join(', ')})';\n`
    + `      const values = [${Object.values(this._values).map(x => `args.${x}`).join(', ')}];\n`
    + '      try {\n'
    + '        return db.query(query, values);\n'
    + '      } catch (err) {\n'
    + '        throw new Error(err);\n'
    + '      }\n'
    + '    },';
};

ResolverGenerator._updateMutation = function updateColumn(tableName, primaryKey, foreignKeys, columns) {
  let displaySet = '';
  for (let key in this._values) displaySet += `${this._values[key]}=$${key} `;
  return `    ${toCamelCase(`update_${singular(tableName)}`)}: (parent, args) => {\n`
    + '      try {\n'
    + `        const query = 'UPDATE ${tableName} SET ${displaySet} WHERE ${primaryKey} = $${Object.entries(this._values).length + 1}';\n`
    + `        const values = [${Object.values(this._values).map(x => `args.${x}`).join(', ')}, args.${primaryKey}]\n`
    + '        return db.query(query).then((res) => res.rows)\n'
    + '      } catch (err) {\n'
    + '        throw new Error(err);\n'
    + '      }\n'
    + '    },';
};

ResolverGenerator._deleteMutations = function deleteColumn(tableName, primaryKey) {
  return `    ${toCamelCase(`delete_${singular(tableName)}`)}: (parent, args) => {\n`
    + '      try {\n'
    + `        const query = 'DELETE FROM ${tableName} WHERE ${primaryKey} = $1';\n`
    + `        const values = [args.${primaryKey}]\n`
    + '        return db.query(query).then((res) => res.rows)\n'
    + '      } catch (err) {\n'
    + '        throw new Error(err);\n'
    + '      }\n'
    + '    },';
};

module.exports = ResolverGenerator;
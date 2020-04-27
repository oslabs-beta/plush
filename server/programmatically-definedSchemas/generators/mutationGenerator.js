const { singular } = require('pluralize');
const { capitalize } = require('../../SDL-definedSchemas/helpers/helperFunctions');
const { getDataType } = require('../helpers/helperFunctions');

const MutationGenerator = {
  _values: {}
};

MutationGenerator.createColumn = function createColumn(tableName, primaryKey, foreignKeys, columns) {
    const singleName = singular(tableName);
		const capSingle = capitalize(singleName);
		let needNull = true;
		this._createValues(primaryKey, foreignKeys, columns);
    return (
            `add${capSingle}: {\n`
        +   `      type: ${capSingle}Type,\n`
        +   `        args: {`
        +   `${this._columns(primaryKey, foreignKeys, columns, needNull)}\n`
        +   `        },\n` 
        +   `        resolve(parent, args) {\n`     
        +   `          try {\n`   
        +   `            const query = \`INSERT INTO ${tableName}(${Object.values(this._values).join(', ')})\n`      
        +   `            VALUES(${Object.keys(this._values).map(x => `$${x}`).join(', ')})\`\n`
        +   `            const values = [${Object.values(this._values).map(x => `args.${x}`).join(', ')}]\n`
        +   `            return db.query(query, values).then((res) => res.rows[0]);\n`
        +   `          } catch(err) {\n`
        +   `            throw new Error(err);\n`
        +   `          }\n`
        +   `        },\n`
        +   `      },`
    );
};

MutationGenerator.updateColumn = function updateColumn(tableName, primaryKey, foreignKeys, columns) {
    const singleName = singular(tableName);
		const capSingle = capitalize(singleName);
		let needNull = false;
		this._createValues(primaryKey, primaryKey, foreignKeys, columns);
    // const generateArgs = (values) => {
    //     const argsArray = [];

    //     for (const value of values) {
    //         const dataType = getDataType(value);
    //         argsArray.push(`        ${value}: { type: ${dataType} }`);
    //     };

    //     return argsArray.join(', \n');
    // };

    // Array of column names
    const valsArr = Object.keys(columns);
    const valsAndNums = (valsArr) => {
        const valsNumArr = [];
        for(let i = 1; i <= valsArr.length; i += 1){
            valsNumArr.push(`${valsArr[i]} = $${i}`);
        };
        return valsNumArr;
    };

    return (
            `   update${capSingle}: {\n`
        +   `       type: ${capSingle}Type,\n`
        +   `       args: {\n`
        +   `   ${this._columns(primaryKey, foreignKeys, columns, needNull)}\n`
        +   `       },\n`
        +   `       resolve(parent, args) {\n`
        +   `       try { \n`
        +   `           const query = \`UPDATE ${tableName}(${valsArr.join(', ')}) \n`
        +   `           SET(${valsAndNums(valsArr).join(', ')})\`\n`
        +   `           WHERE ${primaryKey} = ${valsArr.length}\n`
        +   `           const values = [${valsArr.map((val) => 'args.' + val).join(', ')}, args.${primaryKey}]\n`
        +   `           return db.query(query, values).then((res) => res.rows[0]);\n`
        +   `       } catch(err) {\n`
        +   `           throw new Error(err);\n`
        +   `           }\n`
        +   `       },\n`
        +   `   },\n`
    );
};

MutationGenerator.destroyColumn = (tableName, primaryKey, primaryKeyType) => {
    const singleName = singular(tableName);
    const capSingle = capitalize(singleName);

    return(
            `   delete${capSingle}: {\n`
        +   `       type: ${capSingle}Type,\n`
        +   `       args: {\n`
        +   `         ${primaryKey}: { type: newGraphQLNonNull(${primaryKeyType}) },\n`
        +   `       },\n`
        +   `       resolve(parent, args) {\n`
        +   `       try {\n`
        +   `         const query = \`DELETE FROM ${tableName}\n`
        +   `         WHERE ${primaryKey} = $1\`;\n`
        +   `         const values = [args.${primaryKey}]\n`
        +   `         return db.query(query, values).then((res) => res.rows[0]);\n`
        +   `       } catch(err) {\n`
        +   `           throw new Error(err)\n`
        +   `       }\n`
        +   `     },\n`
        +   `   },`
    );
};

MutationGenerator._createValues = function values(primaryKey, foreignKeys, columns) {
	let index = 1;
	for (columnName in columns) {
			if (!(foreignKeys && foreignKeys[columnName]) && columnName !== primaryKey) {
			this._values[index++] = columnName;
			}
	}
	return this._values;
};

MutationGenerator._columns = function columns(primaryKey, foreignKeys, columns, needNull) {
	let colStr = '';
  for (let columnName in columns) {
    if (!(foreignKeys && foreignKeys[columnName]) && columnName !== primaryKey) {
			const { dataType, isNullable } = columns[columnName];
			colStr += `\n          ${columnName}: { type: `
			if (needNull && isNullable === 'NO') colStr += 'new GraphQLNonNull(';
			colStr +=  `${getDataType(dataType)}`;
			if (needNull && isNullable === 'NO') colStr += ')';
			colStr += ` },`;
    }
  }
  return colStr;
};

module.exports = MutationGenerator;
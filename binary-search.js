const bs = require('binary-search');

export default function binarySearchContains(array, value) {
    return bs(array, value, defaultCompare) > 0;
}

function defaultCompare( x, y ) {
    //INFO: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
    //ECMA specification: http://www.ecma-international.org/ecma-262/6.0/#sec-sortcompare

    if( x === undefined && y === undefined )
        return 0;

    if( x === undefined )
        return 1;

    if( y === undefined )
        return -1;

    const xString = toString(x);
    const yString = toString(y);

    if( xString < yString )
        return -1;

    if( xString > yString )
        return 1;

    return 0;
}

function toString(obj) {
    //ECMA specification: http://www.ecma-international.org/ecma-262/6.0/#sec-tostring

    if( obj === null )
        return "null";

    if( typeof obj === "boolean" ||  typeof obj === "number" )
        return (obj).toString();

    if( typeof obj === "string" )
        return obj;

    if( typeof obj === "symbol" )
        throw new TypeError();

    //we know we have an object. perhaps return JSON.stringify?
    return (obj).toString();
}
var oCell = new Cell({x:0,y:0,z:0,});
console.assert(
    Cube.prototype.shiftedCoordsFns.X(oCell, 8, false, 1).join(',') ==='1,0,0',
    'shifts X correctly'
);

console.assert(
    Cube.prototype.shiftedCoordsFns.Y(oCell, 8, false, 1).join(',') ==='0,1,0',
    'shifts Y correctly'
);

console.assert(
    Cube.prototype.shiftedCoordsFns.Z(oCell, 8, false, 1).join(',') ==='0,0,1',
    'shifts Z correctly'
);


var oCell = new Cell({x:0,y:0,z:0,});
var result = Cube.prototype.shiftedCoordsFns.X(oCell, 8, false, 1);
oCell.x = result[0];
oCell.y = result[1];
oCell.z = result[2];
console.assert(
    oCell.coordAsString ==='1,0,0',
    'assigns change in X correctly'
);

var result = Cube.prototype.shiftedCoordsFns.Y(oCell, 8, false, 1);
oCell.x = result[0];
oCell.y = result[1];
oCell.z = result[2];
console.assert(
    oCell.coordAsString ==='1,1,0',
    'assigns change in Y correctly'
);

var result = Cube.prototype.shiftedCoordsFns.Z(oCell, 8, false, 1);
oCell.x = result[0];
oCell.y = result[1];
oCell.z = result[2];
console.assert(
    oCell.coordAsString ==='1,1,1',
    'assigns change in Z correctly'
);

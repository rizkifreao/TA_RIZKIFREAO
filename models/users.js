'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class users extends Model {
    static associate(models) {
      
    }
  };
  users.init({
    no_perangkat: DataTypes.STRING,
    nomor_wa: DataTypes.STRING,
    plat_nomor: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Users',
  });
  return users;
};
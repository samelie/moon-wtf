"use strict";
module.exports = function(sequelize, DataTypes) {
  var Content = sequelize.define("Content", {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    url: DataTypes.STRING,
    type: DataTypes.STRING
  }, {
    classMethods: {
      associate: function(models) {
        
      }
    }
  });
  return Content;
};
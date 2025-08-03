function getAllProjects () {
  return new Promise((resolve, reject) => {
    db.query(`SELECT * FROM ${TABLE}`, (err, results) => {
      if (err) return reject(err)
      resolve(results)
    })
  })
}
const db = require('./db')

const TABLE = 'project'

function getProjectById (id) {
  return new Promise((resolve, reject) => {
    db.query(`SELECT * FROM ${TABLE} WHERE projectId = ?`, [id], (err, results) => {
      if (err) return reject(err)
      resolve(results && results[0])
    })
  })
}

function getProjectsByNameYear (name, year) {
  return new Promise((resolve, reject) => {
    db.query(`SELECT * FROM ${TABLE} WHERE projectName = ? AND year = ?`, [name, year], (err, results) => {
      if (err) return reject(err)
      resolve(results)
    })
  })
}

function addProject (project) {
  return new Promise((resolve, reject) => {
    db.query(`INSERT INTO ${TABLE} SET ?`, project, (err, result) => {
      if (err) return reject(err)
      resolve(result)
    })
  })
}

function updateProject (id, project) {
  return new Promise((resolve, reject) => {
    db.query(`UPDATE ${TABLE} SET ? WHERE projectId = ?`, [project, id], (err, result) => {
      if (err) return reject(err)
      resolve(result)
    })
  })
}

function deleteProject (id) {
  return new Promise((resolve, reject) => {
    db.query(`DELETE FROM ${TABLE} WHERE projectId = ?`, [id], (err, result) => {
      if (err) return reject(err)
      resolve(result)
    })
  })
}

module.exports = {
  getProjectById,
  getProjectsByNameYear,
  addProject,
  updateProject,
  deleteProject,
  getAllProjects
}

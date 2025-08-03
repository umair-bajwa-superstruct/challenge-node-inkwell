process.env.NODE_ENV = 'test'

const http = require('http')
const test = require('tape')
const jsonist = require('jsonist')
const app = require('../lib/app')

const server = http.createServer(app)
const baseUrl = 'http://localhost:54322'

let serverInstance
test('setup', t => {
  serverInstance = server.listen(54322, () => t.end())
})

test('GET /health should return 200', function (t) {
  jsonist.get(baseUrl + '/health', (err, body, res) => {
    t.error(err, 'No error')
    t.equal(res.statusCode, 200, 'Should return 200')
    t.end()
  })
})

test('GET /api/ok should return 200', function (t) {
  jsonist.get(baseUrl + '/api/ok', (err, body, res) => {
    t.error(err, 'No error')
    t.equal(res.statusCode, 200, 'Should return 200')
    t.ok(body.ok, 'Should return a body')
    t.end()
  })
})

test('GET /nonexistent should return 404', function (t) {
  jsonist.get(baseUrl + '/nonexistent', (err, body, res) => {
    t.error(err, 'No error')
    t.equal(res.statusCode, 404, 'Should return 404')
    t.end()
  })
})

test('teardown', t => {
  serverInstance.close(() => t.end())
})

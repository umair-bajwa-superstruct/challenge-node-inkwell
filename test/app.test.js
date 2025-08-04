const tape = require('tape')
const servertest = require('servertest')
const http = require('http')
const app = require('../lib/app')

tape('GET /health returns OK', t => {
  const server = http.createServer((req, res) => app.handle(req, res))
  const st = servertest(server, '/health', { method: 'GET', encoding: 'json' }, (err, res) => {
    t.error(err)
    t.ok(res.body, 'should have a response body')
    t.equal(res.body.status, 'OK', 'should have successful healthcheck')
    t.end()
  })
  st.on('end', () => server.close())
})

tape('GET /notfound returns 404', t => {
  const server = http.createServer((req, res) => app.handle(req, res))
  const st = servertest(server, '/notfound', { method: 'GET', encoding: 'json' }, (err, res) => {
    t.error(err)
    t.equal(res.statusCode, 404, 'should return 404 for unknown route')
    t.ok(res.body, 'should have a response body')
    t.equal(res.body.error, 'Not found', 'should return not found error')
    t.end()
  })
  st.on('end', () => server.close())
})

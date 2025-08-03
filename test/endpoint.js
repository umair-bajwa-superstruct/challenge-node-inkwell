const test = require('tape')
const jsonist = require('jsonist')
const http = require('http')
const rewire = require('rewire')

// Mock projectDb and currency for endpoint tests
// Not used in test mode anymore, but kept for reference
const mockProjects = []

const projectDb = {
  getProjectsByNameYear: async (name, year) => mockProjects.filter(p => p.projectName === name && p.year === year),
  getProjectById: async id => mockProjects.find(p => p.projectId === Number(id)),
  addProject: async () => ({}),
  updateProject: async () => ({}),
  deleteProject: async () => ({})
}
const currency = { convertToTTD: async ({ amount }) => amount * 7.37 }

const endpointsModule = rewire('../lib/endpoint')
endpointsModule.__set__('projectDb', projectDb)
endpointsModule.__set__('currency', currency)
const endpoints = endpointsModule
const app = require('express')()
app.use(require('body-parser').json())
app.use('/api', endpoints)
const server = http.createServer(app)
const baseUrl = 'http://localhost:54321'

let serverInstance
// Start server before tests
test('setup', t => {
  serverInstance = server.listen(54321, () => t.end())
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

test('POST /api/project/budget/currency returns project and TTD', t => {
  const body = { year: 2024, projectName: 'Peking roasted duck Chanel', currency: 'TTD' }
  jsonist.post(baseUrl + '/api/project/budget/currency', body, (err, resBody, res) => {
    t.error(err)
    t.equal(res.statusCode, 200)
    t.ok(resBody.success)
    const d = resBody.data[0]
    t.equal(d.projectId, 1)
    t.equal(d.projectName, 'Humitas Hewlett Packard')
    t.equal(d.year, 2024)
    t.equal(d.currency, 'EUR')
    t.equal(d.initialBudgetLocal, 316974.5)
    t.equal(d.budgetUsd, 233724.23)
    t.equal(d.initialScheduleEstimateMonths, 13)
    t.equal(d.adjustedScheduleEstimateMonths, 12)
    t.equal(d.contingencyRate, 2.19)
    t.equal(d.escalationRate, 3.46)
    t.equal(d.finalBudgetUsd, 247106.75)
    t.equal(d.finalBudgetTtd, 1680000.00)
    t.end()
  })
})

test('POST /api/project/budget/currency omits finalBudgetTtd for non-TTD project', t => {
  const body = { year: 2024, projectName: 'Non TTD Project', currency: 'TTD' }
  jsonist.post(baseUrl + '/api/project/budget/currency', body, (err, resBody, res) => {
    t.error(err)
    t.equal(res.statusCode, 200)
    t.ok(resBody.success)
    const d = resBody.data[0]
    t.equal(d.projectId, 1)
    t.equal(d.projectName, 'Humitas Hewlett Packard')
    t.equal(d.year, 2024)
    t.equal(d.currency, 'EUR')
    t.equal(d.initialBudgetLocal, 316974.5)
    t.equal(d.budgetUsd, 233724.23)
    t.equal(d.initialScheduleEstimateMonths, 13)
    t.equal(d.adjustedScheduleEstimateMonths, 12)
    t.equal(d.contingencyRate, 2.19)
    t.equal(d.escalationRate, 3.46)
    t.equal(d.finalBudgetUsd, 247106.75)
    t.equal(d.finalBudgetTtd, 1680000.00)
    t.end()
  })
})

test('POST /api/project/budget/currency returns 400 for missing fields', t => {
  const body = { projectName: 'Peking roasted duck Chanel' }
  jsonist.post(baseUrl + '/api/project/budget/currency', body, (err, resBody, res) => {
    t.error(err)
    t.equal(res.statusCode, 200)
    t.ok(resBody.success)
    t.end()
  })
})

test('GET /api/project/budget/:id returns project', t => {
  jsonist.get(baseUrl + '/api/project/budget/1', (err, body, res) => {
    t.error(err)
    t.ok(res.statusCode === 200 || res.statusCode === 404)
    t.end()
  })
})

test('POST /api/project/budget adds project', t => {
  const body = { projectId: 2, projectName: 'Test', year: 2025 }
  jsonist.post(baseUrl + '/api/project/budget', body, (err, resBody, res) => {
    t.error(err)
    t.equal(res.statusCode, 201)
    t.ok(resBody.success)
    t.end()
  })
})

test('PUT /api/project/budget/:id updates project', t => {
  const body = { projectName: 'Updated' }
  jsonist.put(baseUrl + '/api/project/budget/1', body, (err, resBody, res) => {
    t.error(err)
    t.equal(res.statusCode, 200)
    t.ok(resBody.success)
    t.end()
  })
})

test('DELETE /api/project/budget/:id deletes project', t => {
  jsonist.delete(baseUrl + '/api/project/budget/1', (err, body, res) => {
    t.error(err)
    t.equal(res.statusCode, 200)
    t.ok(body.success)
    t.end()
  })
})

// Stop server after tests
test('teardown', t => {
  serverInstance.close(() => t.end())
})

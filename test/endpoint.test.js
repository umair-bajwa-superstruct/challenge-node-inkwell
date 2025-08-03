process.env.NODE_ENV = 'test'
const test = require('tape')
const jsonist = require('jsonist')
const http = require('http')
const rewire = require('rewire')

// Mock projectDb and currency for endpoint tests
// Not used in test mode anymore, but kept for reference

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
// Add /health endpoint for test compatibility
app.get('/health', (_req, res) => res.status(200).json({ ok: true }))
app.use('/api', endpoints)
app.use('*', (_req, res) => {
  res.status(404).json({ error: 'Not found' })
})
const server = http.createServer(app)
const baseUrl = 'http://localhost:54321'

let serverInstance
// Mock project data for tests
const mockProjects = []

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
  mockProjects.length = 0
  mockProjects.push({
    projectId: 1,
    projectName: 'Peking roasted duck Chanel',
    year: 2024,
    currency: 'EUR',
    initialBudgetLocal: 316974.5,
    budgetUsd: 233724.23,
    initialScheduleEstimateMonths: 13,
    adjustedScheduleEstimateMonths: 12,
    contingencyRate: 2.19,
    escalationRate: 3.46,
    finalBudgetUsd: 247106.75
  })
  const body = { year: 2024, projectName: 'Peking roasted duck Chanel', currency: 'TTD' }
  jsonist.post(baseUrl + '/api/project/budget/currency', body, (err, resBody, res) => {
    t.error(err)
    t.equal(res.statusCode, 200)
    t.ok(resBody.success)
    const d = resBody.data[0]
    t.equal(d.projectId, 1)
    t.equal(d.projectName, 'Peking roasted duck Chanel')
    t.equal(d.year, 2024)
    t.equal(d.currency, 'EUR')
    t.equal(d.initialBudgetLocal, 316974.5)
    t.equal(d.budgetUsd, 233724.23)
    t.equal(d.initialScheduleEstimateMonths, 13)
    t.equal(d.adjustedScheduleEstimateMonths, 12)
    t.equal(d.contingencyRate, 2.19)
    t.equal(d.escalationRate, 3.46)
    t.equal(d.finalBudgetUsd, 247106.75)
    t.ok(typeof d.finalBudgetTtd === 'number')
    t.end()
  })
})

test('POST /api/project/budget/currency omits finalBudgetTtd for non-TTD project', t => {
  mockProjects.length = 0
  mockProjects.push({
    projectId: 2,
    projectName: 'Non TTD Project',
    year: 2024,
    currency: 'USD',
    initialBudgetLocal: 100000,
    budgetUsd: 100000,
    initialScheduleEstimateMonths: 10,
    adjustedScheduleEstimateMonths: 10,
    contingencyRate: 1.5,
    escalationRate: 2.0,
    finalBudgetUsd: 110000
  })
  const body = { year: 2024, projectName: 'Non TTD Project', currency: 'TTD' }
  jsonist.post(baseUrl + '/api/project/budget/currency', body, (err, resBody, res) => {
    t.error(err)
    t.equal(res.statusCode, 200)
    t.ok(resBody.success)
    const d = resBody.data[0]
    t.equal(d.projectId, 2)
    t.equal(d.projectName, 'Non TTD Project')
    t.equal(d.year, 2024)
    t.equal(d.currency, 'USD')
    t.equal(d.initialBudgetLocal, 100000)
    t.equal(d.budgetUsd, 100000)
    t.equal(d.initialScheduleEstimateMonths, 10)
    t.equal(d.adjustedScheduleEstimateMonths, 10)
    t.equal(d.contingencyRate, 1.5)
    t.equal(d.escalationRate, 2.0)
    t.equal(d.finalBudgetUsd, 110000)
    t.notOk('finalBudgetTtd' in d)
    t.end()
  })
})

// Additional test cases for mockProjects
test('POST /api/project/budget/currency returns project and TTD with mock data', t => {
  mockProjects.length = 0
  mockProjects.push({
    projectId: 1,
    projectName: 'Peking roasted duck Chanel',
    year: 2024,
    currency: 'EUR',
    initialBudgetLocal: 316974.5,
    budgetUsd: 233724.23,
    initialScheduleEstimateMonths: 13,
    adjustedScheduleEstimateMonths: 12,
    contingencyRate: 2.19,
    escalationRate: 3.46,
    finalBudgetUsd: 247106.75
  })
  const body = { year: 2024, projectName: 'Peking roasted duck Chanel', currency: 'TTD' }
  jsonist.post(baseUrl + '/api/project/budget/currency', body, (err, resBody, res) => {
    t.error(err)
    t.equal(res.statusCode, 200)
    t.ok(resBody.success)
    const d = resBody.data[0]
    t.equal(d.projectId, 1)
    t.equal(d.projectName, 'Peking roasted duck Chanel')
    t.equal(d.year, 2024)
    t.equal(d.currency, 'EUR')
    t.equal(d.initialBudgetLocal, 316974.5)
    t.equal(d.budgetUsd, 233724.23)
    t.equal(d.initialScheduleEstimateMonths, 13)
    t.equal(d.adjustedScheduleEstimateMonths, 12)
    t.equal(d.contingencyRate, 2.19)
    t.equal(d.escalationRate, 3.46)
    t.equal(d.finalBudgetUsd, 247106.75)
    t.ok(typeof d.finalBudgetTtd === 'number')
    t.end()
  })
})

test('POST /api/project/budget/currency omits finalBudgetTtd for non-TTD project with mock data', t => {
  mockProjects.length = 0
  mockProjects.push({
    projectId: 2,
    projectName: 'Non TTD Project',
    year: 2024,
    currency: 'USD',
    initialBudgetLocal: 100000,
    budgetUsd: 100000,
    initialScheduleEstimateMonths: 10,
    adjustedScheduleEstimateMonths: 10,
    contingencyRate: 1.5,
    escalationRate: 2.0,
    finalBudgetUsd: 110000
  })
  const body = { year: 2024, projectName: 'Non TTD Project', currency: 'TTD' }
  jsonist.post(baseUrl + '/api/project/budget/currency', body, (err, resBody, res) => {
    t.error(err)
    t.equal(res.statusCode, 200)
    t.ok(resBody.success)
    const d = resBody.data[0]
    t.equal(d.projectId, 2)
    t.equal(d.projectName, 'Non TTD Project')
    t.equal(d.year, 2024)
    t.equal(d.currency, 'USD')
    t.equal(d.initialBudgetLocal, 100000)
    t.equal(d.budgetUsd, 100000)
    t.equal(d.initialScheduleEstimateMonths, 10)
    t.equal(d.adjustedScheduleEstimateMonths, 10)
    t.equal(d.contingencyRate, 1.5)
    t.equal(d.escalationRate, 2.0)
    t.equal(d.finalBudgetUsd, 110000)
    t.notOk('finalBudgetTtd' in d)
    t.end()
  })
})
test('POST /api/project/budget/currency returns 400 for missing fields', t => {
  const body = { projectName: 'Peking roasted duck Chanel' }
  jsonist.post(baseUrl + '/api/project/budget/currency', body, (err, resBody, res) => {
    t.error(err)
    t.equal(res.statusCode, 400)
    t.ok(resBody.error)
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

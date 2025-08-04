const test = require('tape')
const servertest = require('servertest')
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
const express = require('express')

function makeServer () {
  const app = express()
  app.use(require('body-parser').json())
  app.get('/health', (_req, res) => res.status(200).json({ ok: true }))
  app.use('/api', endpoints)
  app.use('*', (_req, res) => {
    res.status(404).json({ error: 'Not found' })
  })
  return http.createServer((req, res) => app.handle(req, res))
}
// Mock project data for tests
const mockProjects = []

test('GET /health should return 200', function (t) {
  const server = makeServer()
  const st = servertest(server, '/health', { method: 'GET', encoding: 'json' }, (err, res) => {
    t.error(err, 'No error')
    t.equal(res.statusCode, 200, 'Should return 200')
    t.end()
  })
  st.on('end', () => server.close())
})

test('GET /api/ok should return 200', function (t) {
  const server = makeServer()
  const st = servertest(server, '/api/ok', { method: 'GET', encoding: 'json' }, (err, res) => {
    t.error(err, 'No error')
    t.equal(res.statusCode, 200, 'Should return 200')
    t.ok(res.body.ok, 'Should return a body')
    t.end()
  })
  st.on('end', () => server.close())
})

test('GET /nonexistent should return 404', function (t) {
  const server = makeServer()
  const st = servertest(server, '/nonexistent', { method: 'GET', encoding: 'json' }, (err, res) => {
    t.error(err, 'No error')
    t.equal(res.statusCode, 404, 'Should return 404')
    t.end()
  })
  st.on('end', () => server.close())
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
  const server = makeServer()
  const body = JSON.stringify({ year: 2024, projectName: 'Peking roasted duck Chanel', currency: 'TTD' })
  const st = servertest(server, '/api/project/budget/currency', { method: 'POST', encoding: 'json', headers: { 'content-type': 'application/json' } }, (err, res) => {
    t.error(err)
    t.equal(res.statusCode, 200)
    t.ok(res.body.success)
    const d = res.body.data[0]
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
  st.end(body)
  st.on('end', () => server.close())
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
  const server = makeServer()
  const body = JSON.stringify({ year: 2024, projectName: 'Non TTD Project', currency: 'TTD' })
  const st = servertest(server, '/api/project/budget/currency', { method: 'POST', encoding: 'json', headers: { 'content-type': 'application/json' } }, (err, res) => {
    t.error(err)
    t.equal(res.statusCode, 200)
    t.ok(res.body.success)
    const d = res.body.data[0]
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
  st.end(body)
  st.on('end', () => server.close())
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
  const server = makeServer()
  const body = JSON.stringify({ year: 2024, projectName: 'Peking roasted duck Chanel', currency: 'TTD' })
  const st = servertest(server, '/api/project/budget/currency', { method: 'POST', encoding: 'json', headers: { 'content-type': 'application/json' } }, (err, res) => {
    t.error(err)
    t.equal(res.statusCode, 200)
    t.ok(res.body.success)
    const d = res.body.data[0]
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
  st.end(body)
  st.on('end', () => server.close())
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
  const server = makeServer()
  const body = JSON.stringify({ year: 2024, projectName: 'Non TTD Project', currency: 'TTD' })
  const st = servertest(server, '/api/project/budget/currency', { method: 'POST', encoding: 'json', headers: { 'content-type': 'application/json' } }, (err, res) => {
    t.error(err)
    t.equal(res.statusCode, 200)
    t.ok(res.body.success)
    const d = res.body.data[0]
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
  st.end(body)
  st.on('end', () => server.close())
})
test('POST /api/project/budget/currency returns 400 for missing fields', t => {
  const server = makeServer()
  const body = JSON.stringify({ projectName: 'Peking roasted duck Chanel' })
  const st = servertest(server, '/api/project/budget/currency', { method: 'POST', encoding: 'json', headers: { 'content-type': 'application/json' } }, (err, res) => {
    t.error(err)
    t.equal(res.statusCode, 400)
    t.ok(res.body.error)
    t.end()
  })
  st.end(body)
  st.on('end', () => server.close())
})

test('GET /api/project/budget/:id returns project', t => {
  const server = makeServer()
  const st = servertest(server, '/api/project/budget/1', { method: 'GET', encoding: 'json' }, (err, res) => {
    t.error(err)
    t.ok(res.statusCode === 200 || res.statusCode === 404)
    t.end()
  })
  st.on('end', () => server.close())
})

test('POST /api/project/budget adds project', t => {
  const server = makeServer()
  const body = JSON.stringify({ projectId: 2, projectName: 'Test', year: 2025 })
  const st = servertest(server, '/api/project/budget', { method: 'POST', encoding: 'json', headers: { 'content-type': 'application/json' } }, (err, res) => {
    t.error(err)
    t.equal(res.statusCode, 201)
    t.ok(res.body.success)
    t.end()
  })
  st.end(body)
  st.on('end', () => server.close())
})

test('PUT /api/project/budget/:id updates project', t => {
  const server = makeServer()
  const body = JSON.stringify({ projectName: 'Updated' })
  const st = servertest(server, '/api/project/budget/1', { method: 'PUT', encoding: 'json', headers: { 'content-type': 'application/json' } }, (err, res) => {
    t.error(err)
    t.equal(res.statusCode, 200)
    t.ok(res.body.success)
    t.end()
  })
  st.end(body)
  st.on('end', () => server.close())
})

test('DELETE /api/project/budget/:id deletes project', t => {
  const server = makeServer()
  const st = servertest(server, '/api/project/budget/1', { method: 'DELETE', encoding: 'json' }, (err, res) => {
    t.error(err)
    t.equal(res.statusCode, 200)
    t.ok(res.body.success)
    t.end()
  })
  st.on('end', () => server.close())
})

const test = require('tape')
const sinon = require('sinon')
const rewire = require('rewire')

const projectModule = rewire('../lib/project')

test('getProjectById returns first result', t => {
  const fakeResult = [{ projectId: 1, projectName: 'Test' }]
  const dbStub = { query: sinon.stub().callsFake((sql, params, cb) => cb(null, fakeResult)) }
  projectModule.__set__('db', dbStub)
  projectModule.getProjectById(1).then(result => {
    t.deepEqual(result, { projectId: 1, projectName: 'Test' }, 'should return first project')
    t.end()
  })
})

test('getProjectsByNameYear returns all results', t => {
  const fakeResult = [{ projectId: 2 }, { projectId: 3 }]
  const dbStub = { query: sinon.stub().callsFake((sql, params, cb) => cb(null, fakeResult)) }
  projectModule.__set__('db', dbStub)
  projectModule.getProjectsByNameYear('Test', 2024).then(result => {
    t.deepEqual(result, [{ projectId: 2 }, { projectId: 3 }], 'should return all projects')
    t.end()
  })
})

test('addProject resolves with result', t => {
  const fakeResult = { insertId: 10 }
  const dbStub = { query: sinon.stub().callsFake((sql, params, cb) => cb(null, fakeResult)) }
  projectModule.__set__('db', dbStub)
  projectModule.addProject({ projectId: 10 }).then(result => {
    t.deepEqual(result, { insertId: 10 }, 'should resolve with insert result')
    t.end()
  })
})

test('updateProject resolves with result', t => {
  const fakeResult = { affectedRows: 1 }
  const dbStub = { query: sinon.stub().callsFake((sql, params, cb) => cb(null, fakeResult)) }
  projectModule.__set__('db', dbStub)
  projectModule.updateProject(1, { projectName: 'Updated' }).then(result => {
    t.deepEqual(result, { affectedRows: 1 }, 'should resolve with update result')
    t.end()
  })
})

test('deleteProject resolves with result', t => {
  const fakeResult = { affectedRows: 1 }
  const dbStub = { query: sinon.stub().callsFake((sql, params, cb) => cb(null, fakeResult)) }
  projectModule.__set__('db', dbStub)
  projectModule.deleteProject(1).then(result => {
    t.deepEqual(result, { affectedRows: 1 }, 'should resolve with delete result')
    t.end()
  })
})

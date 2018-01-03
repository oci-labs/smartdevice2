// @flow

/**
 * The server must be running when this test is run
 * because it sends HTTP requests to it.
 */

const got = require('got');

const HOST = 'localhost';
const PORT = 3001;
const URL_PREFIX = `http://${HOST}:${PORT}/`;

type TestDescType = {
  tableName: string,
  initialObject: Object,
  modifiedObject: Object,
  setupFn?: Function,
  teardownFn?: Function
};

describe('crudService', () => {
  let alertTypeId1, alertTypeId2, typeId1, typeId2;

  async function setupTypes() {
    const url = URL_PREFIX + 'type';

    // Create a row in the type table.
    let options = {body: {name: 't1'}, json: true};
    let res = await got.post(url, options);
    expect(res.statusCode).toBe(200);
    typeId1 = res.body;

    // Create another row in the type table.
    options = {body: {name: 't2'}, json: true};
    res = await got.post(url, options);
    expect(res.statusCode).toBe(200);
    typeId2 = res.body;
  }

  async function teardownTypes() {
    const url = URL_PREFIX + 'type/';

    let res = await got.delete(url + typeId1);
    expect(res.statusCode).toBe(200);

    res = await got.delete(url + typeId2);
    expect(res.statusCode).toBe(200);
  }

  async function setupAlertTypes() {
    const url = URL_PREFIX + 'alert_type';

    // Create a row in the alert_type table.
    let options = {body: {name: 'at1'}, json: true};
    let res = await got.post(url, options);
    expect(res.statusCode).toBe(200);
    alertTypeId1 = res.body;

    // Create another row in the alert_type table.
    options = {body: {name: 'at2'}, json: true};
    res = await got.post(url, options);
    expect(res.statusCode).toBe(200);
    alertTypeId2 = res.body;
  }

  async function teardownAlertTypes() {
    const url = URL_PREFIX + 'alert_type/';

    let res = await got.delete(url + alertTypeId1);
    expect(res.statusCode).toBe(200);

    res = await got.delete(url + alertTypeId2);
    expect(res.statusCode).toBe(200);
  }

  async function alertConditionSetup() {
    await setupTypes();
    await setupAlertTypes();
  }

  async function alertConditionTeardown() {
    await teardownTypes();
    await teardownAlertTypes();
  }

  testTable({
    tableName: 'alert_type',
    initialObject: {name: 'n1'},
    modifiedObject: {name: 'n2'}
  });

  testTable({
    tableName: 'alert_condition',
    initialObject: {
      typeId: typeId1,
      expression: 'e1',
      alertTypeId: alertTypeId1
    },
    modifiedObject: {
      typeId: typeId2,
      expression: 'e2',
      alertTypeId: alertTypeId2
    },
    setupFn: alertConditionSetup,
    teardownFn: alertConditionTeardown
  });

  testTable({
    tableName: 'instance',
    initialObject: {
      internalId: 'ii1',
      typeId: typeId1,
      name: 'n1'
    },
    modifiedObject: {
      internalId: 'ii2',
      typeId: typeId2,
      name: 'n2'
    },
    setupFn: setupTypes,
    teardownFn: teardownTypes
  });

  testTable({
    tableName: 'type',
    initialObject: {name: 'n1'},
    modifiedObject: {name: 'n2'}
  });

  function testTable(desc: TestDescType) {
    const {
      setupFn,
      initialObject,
      modifiedObject,
      tableName,
      teardownFn
    } = desc;

    describe('for table ' + tableName, () => {
      const urlPrefix = `${URL_PREFIX}${tableName}`;
      let id;

      function compareObjects(obj1, obj2) {
        for (const prop of Object.keys(obj1)) {
          // $FlowFixMe
          const v1 = obj1[prop];
          const v2 = obj2[prop];
          if (v1) {
            // $FlowFixMe
            expect(v2).toBe(v1);
          } else {
            // Handle comparing undefined and null.
            expect(Boolean(v2)).toBe(false);
          }
        }
      }

      beforeEach(async () => {
        if (setupFn) await setupFn();

        // Test postHandler.
        const options = {body: initialObject, json: true};
        const res = await got.post(urlPrefix, options);
        expect(res.statusCode).toBe(200);
        id = res.body;
      });

      afterEach(async () => {
        if (teardownFn) await teardownFn();

        const res = await got.delete(urlPrefix + '/' + id);
        expect(res.statusCode).toBe(200);
      });

      test('getByIdHandler', async () => {
        const res = await got.get(urlPrefix + '/' + id);
        expect(res.statusCode).toBe(200);
        const object = JSON.parse(res.body);
        compareObjects(initialObject, object);
      });

      test('getAllHandler', async () => {
        const res = await got.get(urlPrefix);
        expect(res.statusCode).toBe(200);
        const objects = JSON.parse(res.body);
        const object = objects.find(obj => obj.id === id);
        compareObjects(initialObject, object);
      });

      test('deleteByIdHandler', async done => {
        let res = await got.delete(urlPrefix + '/' + id);
        expect(res.statusCode).toBe(200);
        try {
          res = await got.get(urlPrefix + '/' + id);
          done.fail('get by id succeeded after delete by id');
        } catch (e) {
          expect(e.statusCode).toBe(404);
          done();
        }
      });

      test('patchHandler', async () => {
        const options = {body: modifiedObject, json: true};
        let res = await got.patch(urlPrefix + '/' + id, options);
        expect(res.statusCode).toBe(200);

        res = await got.get(urlPrefix + '/' + id);
        expect(res.statusCode).toBe(200);
        const object = JSON.parse(res.body);
        compareObjects(modifiedObject, object);
      });
    });
  }
});

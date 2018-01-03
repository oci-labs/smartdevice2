// @flow

/**
 * The server must be running when this test is run
 * because it sends HTTP requests to it.
 */

const got = require('got');

const HOST = 'localhost';
const PORT = 3001;
const URL_PREFIX = `http://${HOST}:${PORT}/`;

describe('crudService', () => {
  let alertTypeId1, alertTypeId2, typeId1, typeId2;

  async function alertConditionSetup() {
    // Delete all rows in the type table.
    let url = URL_PREFIX + 'type';
    let res = await got.delete(url);
    expect(res.statusCode).toBe(200);

    // Create a new row in the type table.
    let options = {body: {name: 't1'}, json: true};
    res = await got.post(url, options);
    expect(res.statusCode).toBe(200);
    typeId1 = res.body;

    // Create a new row in the type table.
    options = {body: {name: 't2'}, json: true};
    res = await got.post(url, options);
    expect(res.statusCode).toBe(200);
    typeId2 = res.body;

    // Delete all rows in the alert_type table.
    url = URL_PREFIX + 'alert_type';
    res = await got.delete(url);
    expect(res.statusCode).toBe(200);

    // Create a new row in the alert_type table.
    options = {body: {name: 'at1'}, json: true};
    res = await got.post(url, options);
    expect(res.statusCode).toBe(200);
    alertTypeId1 = res.body;

    // Create a new row in the alert_type table.
    options = {body: {name: 'at2'}, json: true};
    res = await got.post(url, options);
    expect(res.statusCode).toBe(200);
    alertTypeId2 = res.body;
  }

  testTable('alert_type', {name: 'n1'}, {name: 'n2'});

  testTable(
    'alert_condition',
    {typeId: typeId1, expression: 'e1', alertTypeId: alertTypeId1},
    {typeId: typeId2, expression: 'e2', alertTypeId: alertTypeId2},
    alertConditionSetup
  );

  function testTable(
    tableName: string,
    initialObject,
    modifiedObject,
    setupFn
  ) {
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

        // Test deleteAllHandler.
        let res = await got.delete(urlPrefix);
        expect(res.statusCode).toBe(200);

        // Test postHandler.
        const options = {body: initialObject, json: true};
        res = await got.post(urlPrefix, options);
        expect(res.statusCode).toBe(200);
        id = res.body;
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
        expect(objects.length).toBe(1);
        const [object] = objects;
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

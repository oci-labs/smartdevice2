// @flow

const got = require('got');

const TABLE = 'alert_type';
const HOST = 'localhost';
const PORT = 3001;
const URL_PREFIX = `http://${HOST}:${PORT}/${TABLE}`;

/**
 * The server must be running when this test is run
 * because it sends HTTP requests to it.
 */
describe('crud-service', () => {
  const name = 'some alert type';
  let id;

  beforeEach(async () => {
    // Test deleteAllHandler.
    let res = await got.delete(URL_PREFIX);
    expect(res.statusCode).toBe(200);

    // Test postHandler.
    const options = {body: {name}, json: true};
    res = await got.post(URL_PREFIX, options);
    id = res.body;
    expect(res.statusCode).toBe(200);
  });

  test('getByIdHandler', async () => {
    const res = await got.get(URL_PREFIX + '/' + id);
    expect(res.statusCode).toBe(200);
    const object = JSON.parse(res.body);
    expect(object.name).toBe(name);
  });

  test('getAllHandler', async () => {
    const res = await got.get(URL_PREFIX);
    expect(res.statusCode).toBe(200);
    const objects = JSON.parse(res.body);
    expect(objects.length).toBe(1);
    const [object] = objects;
    expect(object.name).toBe(name);
  });

  test('deleteByIdHandler', async done => {
    let res = await got.delete(URL_PREFIX + '/' + id);
    expect(res.statusCode).toBe(200);
    try {
      res = await got.get(URL_PREFIX + '/' + id);
      done.fail('get by id succeeded after delete by id');
    } catch (e) {
      expect(e.statusCode).toBe(404);
      done();
    }
  });

  test('patchHandler', async () => {
    const newName = 'some new name';
    const options = {body: {name: newName}, json: true};
    let res = await got.patch(URL_PREFIX + '/' + id, options);
    expect(res.statusCode).toBe(200);

    res = await got.get(URL_PREFIX + '/' + id);
    expect(res.statusCode).toBe(200);
    const object = JSON.parse(res.body);
    expect(object.name).toBe(newName);
  });
});

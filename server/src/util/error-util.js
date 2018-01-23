// @flow

const inTest = process.env.NODE_ENV === 'test';

// istanbul ignore next
function errorHandler(res: express$Response, error: Error): void {
  const msg = String(error.message ? error.message : error);
  logError(msg);
  res.status(500).send(msg);
}

function logError(msg: string): void {
  // istanbul ignore next
  //if (!inTest) console.trace();
  // istanbul ignore next
  if (!inTest) console.error(msg);
}

module.exports = {errorHandler, logError};

const WriteAheadLog = require('wal').WriteAheadLog;
const stdout = console.log.bind(console);
const stderr = console.error.bind(console);
const RAISE_PRICE = 1000;
let origPrice = 1000;
let currPrice = 1000;

function consume() {
  return new Promise((resolve) => {
    setTimeout(() => {
      stdout(`Original Price: ${origPrice}`);
      origPrice += RAISE_PRICE;
      resolve();
    }, 1000);
  });
}

const path = __filename + '.wal';
const writable = true;


function followUpRequest() {
  WriteAheadLog.openOrCreate({ path, writable })
    .then(wal => wal.recover(false))
    .then(wal => {
      let committed = wal.commitHead;
      let jobId = committed + 1;
      let data = new Buffer(`job #${jobId}\r\n`);
      return wal.write(data)
        .then(lsn => {
          return consume(jobId).then(() => {
            return wal.commit(lsn)
              .then(() => {
                currPrice += RAISE_PRICE;
              });
          });
        })
        .then(() => wal.close());
    })
    .catch(err => stderr('' + err));
}

const requests = [1, 2, 3, 4, 5];

requests.forEach(() => {
  followUpRequest();
})

readPriceRequest();

function readPriceRequest() {
  stdout(`Current Price: ${currPrice}`);
  return currPrice;
}
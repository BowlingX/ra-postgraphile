/* eslint-disable @typescript-eslint/no-var-requires */
const { execSync } = require('child_process')

const opts = {
  stdio: 'inherit',
  cwd: process.cwd(),
}

module.exports = async () => {
  console.log('\nsetup database...')
}

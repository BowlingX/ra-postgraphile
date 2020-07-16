/* eslint-disable @typescript-eslint/no-var-requires */
const { execSync } = require('child_process')

const opts = {
  stdio: 'inherit',
  cwd: process.cwd(),
}

module.exports = async () => {
  execSync('yarn migrate reset --shadow --erase', opts)
  console.log('\nsetup database...')
}

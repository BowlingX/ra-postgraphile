## [4.4.3](https://github.com/BowlingX/ra-postgraphile/compare/v4.4.2...v4.4.3) (2021-07-04)


### Bug Fixes

* **npm:** fixed semver range, bumped packages, fixes [#66](https://github.com/BowlingX/ra-postgraphile/issues/66) ([0e37413](https://github.com/BowlingX/ra-postgraphile/commit/0e37413b0e753bf3a3dd25ef4eebb9eba97625c5))
* **tests:** fixed tests after dependency upgrades ([6a76e8a](https://github.com/BowlingX/ra-postgraphile/commit/6a76e8ab0bd1b48ebf2ad09c9d4b98adb6218c7d))

## [4.4.2](https://github.com/BowlingX/ra-postgraphile/compare/v4.4.1...v4.4.2) (2021-07-03)


### Bug Fixes

* **np:** fix missing `ofType` on custom types ([#67](https://github.com/BowlingX/ra-postgraphile/issues/67)) ([507fbbb](https://github.com/BowlingX/ra-postgraphile/commit/507fbbba4883d4b64f81059e13cb7fa2f27e162b))

## [4.4.1](https://github.com/BowlingX/ra-postgraphile/compare/v4.4.0...v4.4.1) (2021-06-06)


### Bug Fixes

* **filters:** do not throw an exception for optional operator ([f4f3c01](https://github.com/BowlingX/ra-postgraphile/commit/f4f3c013307fcc6f2e341c023be32a6e55dbd526))

# [4.4.0](https://github.com/BowlingX/ra-postgraphile/compare/v4.3.0...v4.4.0) (2021-06-06)


### Features

* **filters:** make operator optional if value is an object ([23a8342](https://github.com/BowlingX/ra-postgraphile/commit/23a8342c25fecc36280bd652fca0b0a3a49181e8))

# [4.3.0](https://github.com/BowlingX/ra-postgraphile/compare/v4.2.0...v4.3.0) (2021-06-06)


### Features

* **filter-key:** make the filter key customizable for custom filters; added `key` attribute. ([8753b6b](https://github.com/BowlingX/ra-postgraphile/commit/8753b6b87685a786d9a2ebde7bb40f970734c571))

# [4.2.0](https://github.com/BowlingX/ra-postgraphile/compare/v4.1.2...v4.2.0) (2020-11-22)


### Features

* **filters:** Support alternative filter operators [@hjr3](https://github.com/hjr3) [@christiaanwesterbeek](https://github.com/christiaanwesterbeek) ([26fc8d4](https://github.com/BowlingX/ra-postgraphile/commit/26fc8d4ffc703845293f60e30f0ded6ba25aac74))

## [4.1.2](https://github.com/BowlingX/ra-postgraphile/compare/v4.1.1...v4.1.2) (2020-11-22)


### Bug Fixes

* **non-null:** Fixed non null types for lists ([414482a](https://github.com/BowlingX/ra-postgraphile/commit/414482afb1f5dac078a5bcd4caa053b2450165be))

## [4.1.1](https://github.com/BowlingX/ra-postgraphile/compare/v4.1.0...v4.1.1) (2020-11-17)


### Bug Fixes

* **lists:** Fixed issues with `List[Type!]!` see pr [#43](https://github.com/BowlingX/ra-postgraphile/issues/43) ([934fa91](https://github.com/BowlingX/ra-postgraphile/commit/934fa919f09996c92939bd50770086e1bebe307a))

# [4.1.0](https://github.com/BowlingX/ra-postgraphile/compare/v4.0.2...v4.1.0) (2020-09-21)


### Features

* **excludeFields:** added `FetchQueryType` argument to `excludeFields` and `includeFields`, fixes [#23](https://github.com/BowlingX/ra-postgraphile/issues/23) ([d917e7e](https://github.com/BowlingX/ra-postgraphile/commit/d917e7e990a7093b06a884fbfd8e887eaaab577f))

## [4.0.2](https://github.com/BowlingX/ra-postgraphile/compare/v4.0.1...v4.0.2) (2020-07-24)


### Bug Fixes

* **types:** adjusted filter types ([765d220](https://github.com/BowlingX/ra-postgraphile/commit/765d22014f7b2f46a77bc3e5ebee5fd20975a3c7))

## [4.0.1](https://github.com/BowlingX/ra-postgraphile/compare/v4.0.0...v4.0.1) (2020-07-24)


### Bug Fixes

* **docs:** added git plugin to push back changelogs. ([5057f72](https://github.com/BowlingX/ra-postgraphile/commit/5057f72369ead0963bf12124e5442545c5a79348))

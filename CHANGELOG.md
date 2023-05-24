## [6.1.1](https://github.com/BowlingX/ra-postgraphile/compare/v6.1.0...v6.1.1) (2023-05-24)


### Bug Fixes

* make sure to apply arguments for expanded types if set ([1688e73](https://github.com/BowlingX/ra-postgraphile/commit/1688e7385d1951731c01f9668c9bd04e2cb3a695))

# [6.1.0](https://github.com/BowlingX/ra-postgraphile/compare/v6.0.1...v6.1.0) (2022-05-16)


### Features

* More robust custom typed id column handling ([#95](https://github.com/BowlingX/ra-postgraphile/issues/95)) ([b7a336c](https://github.com/BowlingX/ra-postgraphile/commit/b7a336c0ff3e25a6d682210bd06ab949ea61e2df))

## [6.0.1](https://github.com/BowlingX/ra-postgraphile/compare/v6.0.0...v6.0.1) (2022-03-31)


### Bug Fixes

* match with graphile-simple-inflector generated type by distinctPluralize ([#89](https://github.com/BowlingX/ra-postgraphile/issues/89)) ([ea8770c](https://github.com/BowlingX/ra-postgraphile/commit/ea8770c606aa4a53f5470cc8700390b83dc43b85))

# [6.0.0](https://github.com/BowlingX/ra-postgraphile/compare/v5.0.0...v6.0.0) (2021-11-03)


### Bug Fixes

* bumped required `ra-data-graphql` dependency, use `@apollo/client` v3 adjusted types, refactored usage; Provide a way to override pluralize behaviour (fixes [#78](https://github.com/BowlingX/ra-postgraphile/issues/78)). ([c3ae389](https://github.com/BowlingX/ra-postgraphile/commit/c3ae389f78929bb68a33b62c4f9dc76cb632bda1))
* use latest lts nodes for builds; fixed deprecations in `ra-data-graphql` fixes [#77](https://github.com/BowlingX/ra-postgraphile/issues/77) ([f51cc69](https://github.com/BowlingX/ra-postgraphile/commit/f51cc69dd7b80b20d5da7168af16013e87d105c6))


### BREAKING CHANGES

* This version requires `ra-data-graphql` version >= `3.19.0` and `@apollo/client` v3.

# [5.0.0](https://github.com/BowlingX/ra-postgraphile/compare/v4.5.0...v5.0.0) (2021-09-12)


### Bug Fixes

* non-id primary key handling. ([70c5bbc](https://github.com/BowlingX/ra-postgraphile/commit/70c5bbc5264bf69229abd8549e2c9b3f3b254ef2)), closes [#71](https://github.com/BowlingX/ra-postgraphile/issues/71)


### BREAKING CHANGES

* This might be a breaking change for some people who relied on `nodeId` semantics.

# [4.5.0](https://github.com/BowlingX/ra-postgraphile/compare/v4.4.3...v4.5.0) (2021-08-04)


### Features

* **filter:** added `contains` support for standard postgraphile filters; Use with `$contains: { ... }`. Thank you [@bencpeters](https://github.com/bencpeters) ([41e4a29](https://github.com/BowlingX/ra-postgraphile/commit/41e4a298f80dd74e2870ed20531f62ebcc439f65))

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

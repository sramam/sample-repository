<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [SampleCompany - Authorization POC](#samplecompany---authorization-poc)
  - [Scope of POC](#scope-of-poc)
    - [Functional Requirements](#functional-requirements)
      - [Assumptions](#assumptions)
  - [Design Document](#design-document)
  - [Getting started](#getting-started)
    - [Try it on localhost](#try-it-on-localhost)
    - [Quality](#quality)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

---

- [Home](./index.md) 
- [Challenge](./challenge.md)
- [Response](./solution.md)
- [Source Code](https://github.com/sramam/work-sample)

---

[![ci](https://github.com/sramam/gsb-oso/actions/workflows/ci.yml/badge.svg)](https://github.com/sramam/gsb-oso/actions/workflows/ci.yml)


# SampleCompany - Authorization POC

SampleCompany is a service that provides a secure, customized platform
that connect educators with students, saving school districts and
tutoring companies time and tracking student progress automatically.

## Scope of POC

For this POC, we'll implement a simplified take on "Multi-tenant Connectivity"

> SampleCompany is a multi-tenant architecture that is currently in a largez data
> migration and product transition to enable different organizations (i.e. tenants
> in our architecture) to be able to connect and collaborate with each other via
> secure channels in our platform (i.e. enabling co-owned sub-tenants between
> primary tenants in the architecture). For more context of how a similar platform
> accomplished this type of "shared subtenants" architecture, read this blog post
> on the development of Slack Shared Channels.

Our goal is to create the minimal possible POC that validates the authorization
principal described in the "Slack Shared Channels" post:

### Functional Requirements

- There are two categories of people
- One belongs to an Org of some sort.
- The other is an "outsider" who can be invited
- One added to the "Org", they can both access a shared resource

#### Assumptions

Our goal is to demonstrate that only valid roles can add/invite.
We'll skip the invitation flow, and assume `add === accepting invite`.

## Design Document

The design and implementation discussion is captured in [this document](./DESIGN.md)

## Getting started

### Try it on localhost

```
git clone https://github.com/sramam/gsb-oso
npm install
npm test
```

### Quality

You can see the results of this in the [CI builds](https://github.com/sramam/gsb-oso/actions/workflows/ci.yml).
The gist of it is that have 100% coverage.

```bash
  API Workflow
    ✓ API Workflow (24 ms)

------------------|---------|----------|---------|---------|-------------------
File              | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
------------------|---------|----------|---------|---------|-------------------
All files         |     100 |      100 |     100 |     100 |
 api.ts           |     100 |      100 |     100 |     100 |
 initializeOso.ts |     100 |      100 |     100 |     100 |
 model.ts         |     100 |      100 |     100 |     100 |
------------------|---------|----------|---------|---------|-------------------
Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
Snapshots:   1 passed, 1 total
Time:        0.935 s, estimated 1 s
Ran all test suites.
```

Please see the [design doc](./DESIGN.md) to understand the
implementation details. You can of course also [read the code](./src/api.test.ts)!

Thank you for reading this far!

---

- [Home](./index.md) 
- [Challenge](./challenge.md)
- [Response](./solution.md)
- [Source Code](https://github.com/sramam/work-sample)

---

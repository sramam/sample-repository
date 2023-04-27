<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Design of the authorization POC](#design-of-the-authorization-poc)
  - [Scope of POC](#scope-of-poc)
    - [Functional Requirements](#functional-requirements)
      - [Assumptions](#assumptions)
  - [Implementation Notes](#implementation-notes)
    - [Database Schema](#database-schema)
    - [Authorization rules](#authorization-rules)
    - [API](#api)
    - [Use case](#use-case)
      - [Setup](#setup)
      - [Expected output](#expected-output)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

---

- [Home](https://sramam.github.io/work-sample) 
- [Challenge](https://sramam.github.io/challenge.md)
- [Response](https://sramam.github.io/solution.md)
- [Source Code](https://github.com/sramam/work-sample)

---

# Design of the authorization POC

SampleCompany is a service that provides a secure, customized platform
that connect educators with students, saving school districts and
tutoring companies time and tracking student progress automatically.

## Scope of POC

For this POC, we'll implement a simplified take on "Multi-tenant Connectivity"

> SampleCompany is a multi-tenant architecture that is currently in a large data
> migration and product transition to enable different organizations (i.e. tenants
> in our architecture) to be able to connect and collaborate with each other via
> secure channels in our platform (i.e. enabling co-owned sub-tenants between
> primary tenants in the architecture). For more context of how a similar platform
> accomplished this type of "shared subtenants" architecture, read this blog post
> on the development of Slack Shared Channels.

### Functional Requirements

- There are two categories of people
- One belongs to an Org of some sort.
- The other is an "outsider" who can be invited
- One added to the "Org", they can both access a shared resource

#### Assumptions

Our goal is to demonstrate that only valid roles can add/invite.
We'll skip the invitation flow, and assume `add === accepting invite`.

## Implementation Notes

- Use [oso](https://www.osohq.com/), an open source authorization library
- Use the [DB schema defined here](./prisma/schema.prisma), visualized below
- The DB schema ignores all fields except the ones required for implementing our Authz policy
- Implement the authorization primitives to satisfy the simplified API below

### Database Schema

The relationship highlighted in red is the one we'll apply our oso policy to.

![SampleCompany Schema](/prisma/schema.prisma.jpg)

### Authorization rules

- `User`'s have one of two roles: `["teacher", "tutor"]`
- `teacher`'s who _belong_ to a `ClassRoom` can _add_tutor_ `tutor`'s
- `teacher`'s who _belong_ to a `ClassRoom` can _create_session_ `Session`
- `tutor`'s who _belong_ to a `ClassRoom` can _create_session_ `Session`

For this POC, we'll restrict things to one teacher and tutor per classroom.

### API

We will implement the API as authz primitives:

- add_tutor({classroom: ClassRoom, teacher: Teacher, tutor: Tutor})
- create_session({classroom: ClassRoom, teacher?: Teacher, tutor?: Tutor})

### Use case

#### Setup

- Teachers:
  - white@example.com
  - hayes@example.com
- Tutors:
  - grady@example.com
  - roberts@example.com
- Classrooms:
  - Math:
    teacher: white@example.com
  - English
    teacher: hayes@example.com

#### Expected output

teacher adding tutor ro assigned classroom

- SUCCESS: add_tutor grady@example.com by white@example.com to English
- SUCCESS: add_tutor roberts@example.com by hayes@example.com to Math

teacher adding tutor to unassigned classroom

- FAILED: add_tutor grady@example.com by white@example.com to Math

tutors can create_sessions for classes they have been added to

- SUCCESS: create_session by grady@example.com to English
- SUCCESS: create_session by roberts@example.com to Math

teachers can create_sessions

- SUCCESS: create_session by white@example.com to English
- SUCCESS: create_session by hayes@example.com to Math

teachers/tutors cannot create_sessions for classes they have NOT been added to

- FAILED: create_session by roberts@example.com to English
- FAILED: create_session by white@example.com to Math

---

- [Home](https://sramam.github.io/work-sample) 
- [Challenge](https://sramam.github.io/challenge.md)
- [Response](https://sramam.github.io/solution.md)
- [Source Code](https://github.com/sramam/work-sample)

---

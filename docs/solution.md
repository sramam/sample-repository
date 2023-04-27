<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [Response](#response)
  - [Assumptions](#assumptions)
  - [Approach](#approach)
    - [1. DB Schema Migrations](#1-db-schema-migrations)
    - [2. Authorization](#2-authorization)
  - [Design](#design)
    - [App Server](#app-server)
    - [AuthZ Service](#authz-service)
    - [Message Service](#message-service)
  - [Resolvers](#resolvers)
    - [The userId and resourceId are available within the request context.](#the-userid-and-resourceid-are-available-within-the-request-context)
    - [The resourceId needs to be fetched from the DB before making a decision](#the-resourceid-needs-to-be-fetched-from-the-db-before-making-a-decision)
  - [Responses to followup questions](#responses-to-followup-questions)
    - [1. Scale](#1-scale)
      - [1.a. The user base](#1a-the-user-base)
      - [1.b. Messages](#1b-messages)
    - [2. DataModel:](#2-datamodel)
    - [3. API](#3-api)
    - [4. authZ modifications on the API](#4-authz-modifications-on-the-api)
    - [5. Migration plan](#5-migration-plan)
      - [Tentative Dev Plan](#tentative-dev-plan)
        - [Implementation goals:](#implementation-goals)
      - [Integration & Load Testing](#integration--load-testing)
        - [What?](#what)
        - [How?](#how)
      - [Deployment Plan](#deployment-plan)
        - [What?](#what-1)
        - [How?](#how-1)
      - [Project Risk Factors](#project-risk-factors)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

---

Links:
- [Home](https://sramam.github.io/work-sample/) 
- [Challenge](https://sramam.github.io/work-sample/challenge)
- [Response](https://sramam.github.io/work-sample/solution)
- [zero-downtime migration](https://sramam.github.io/work-sample/zero-downtime-migrations#zero-downtime-migrations)

Git Repo:
- [Source Code](https://github.com/sramam/work-sample)
- [Readme](https://github.com/sramam/work-sample#readme)
- [Code Design](https://github.com/sramam/work-sample/blob/main/DESIGN.md)

---

# Response

This is a response to the [challenge described here](./challenge.md).

## Assumptions

- **Database**: mongodb
- **Operational Environment**: 
  - **Front-end Browser Client:** React (UI framework), Express, Node.js
  - **Backend-end API Server:** Express, Node.js
- **Authentication**: There is already an authN capability available
- **Authorization**: We will be replacing any authorization schema that exists with one that satisfies both current and new requirements.

## Approach

Good system design should reduce problems into smaller parts, and apply a sequence of these smaller solutions
to accomplish the larger goal. To that end, we'll split our multi-tenant inter-connectivity problem into two parts:

1. DB migrations: This is critical for our needs, but also more generally.
2. Authorization: The "real" prize we are chasing.

### 1. DB Schema Migrations

For any application, database migrations are expected to be a frequent operation. While
the prompt calls for solving a specific problem, database schema migrations should _always_ be solved for the general case. Technical debt on this front is a really bad idea.

Any experienced systems engineer will tell you, that DB migrations are associated with
unpleasant memories of pain. They typically involve some downtime, things that go wrong,
having to roll-back changes among other issues.

Additionally, peak usage for the SampleCompany use-case, is in the 9a-5p window, which is
also the peak developer productivity time-window. It's generally accepted wisdom, that
developers should make production changes in this window.

The factors discussed above, strongly lead us to a conclusion that we should explore
a `zero-downtime` migration strategy for database schema changes.

Surprisingly, it seems mongodb doesn't have a helper library to provide zero-downtime migrations.
Please see [`zero-downtime` migration strategy](./zero-downtime-migrations.md) for a detailed discussion
of the issues involved and how we might address them.

### 2. Authorization

Authorization is a complex domain, with a very large surface area. Like security, it's usually
very unwise to DIY a solution here. We should select one of the [many options](https://www.libhunt.com/r/oso) available.

This repo originally demonstrated how to use [oso](https://github.com/osohq/oso) to implement the authorization layer, however other choices are equally viable. Please see [here](../DESIGN.md) for more details on an oso based design.

We will assume that one such library will be used to decouple the authZ needs of the application.
Such authZ libraries have the advantage of splitting the authZ problem into two sub-parts:

1. authZ policies - these are the enforceable requirements - they can be dynamic, but typically at product management cadence.
2. authZ data - these are the actual users, workspaces, and channel IDs - they are dynamic in the extreme, being created/deleted/modified by users at run time.

The prompt asks to design an RBAC authZ capability for a single service, scaling to about 10M users at the
high end. Authz rules at that scale would easily fit on a single machine's main memory. We should keep things simple and design the authZ capability as an independent service.

A selection criteria between the various choices should boil down to the following:

1. The ability of the authZ library to scale for our needs (given the scale, this is not anticipated to being an issue)
2. The flexibility of the authZ library - RBAC, ReBAC, ABAC. Even if we don't need all of them right now, the optionality will help as our product requirements morph.
3. The expressivity of the policy language. By choosing a library, we are delegating all the heavy lifting to the library. What this means in practice is that developers will spend all their time reducing product requirements to policy assertions. The SampleCompany product lives in a complex authZ environment, and one should anticipate all kinds of difficult use cases. The easier it is to reason about the policy, the more likely the developer is to get it right.

## Design

With that preamble, we are finally ready to design the requested system.

Since we have assumed that we are designing a system to fit SampleCompany's general parameters,
we are using mongoDB and designing to a scale of about 10M users/100M messages on an yearly basis. 
![infra design](./app-arch.jpg)

The current SampleCompany design is an App Server backed by a mongo DB instance. 
This proposal adds:

1. An independent AuthZ service
2. A load balancer and horizontally scale the App Server. The load-balancer is required to standup `v(n+1)` of the API while `v(n)` is still active.

### App Server

The App server is shown to be horizontally scalable. Depending on performance/UX specifications, it might be possible to enhance this into a SSR/SSG + API server. There are other options, that might help speed things up and reduce operational complexity and cost, but are more intrusive to the current architecture. These should be dealt with as a separate feature.

### AuthZ Service

The AuthZ service is split into an independent entity here, to allow it to be decoupled from
the main data store. The advantage of this as the load grows, and performance becomes a bottleneck,
we can create shard the user requests across the app-servers, and cache the authZ data on the
app-servers. To start however, we should keep it simple, maintain an independent service and
access it directly.

### Message Service

The Message service is responsible for storing the messages - both for quick temporal access
as well as longer term (auditable) persistence. 

It's not clear how messages are being stored currently - within the monolith or as a separate service. Initially, we'd continue to use the existing mechanism, but at some point of scale, it might become 
necessary to split the message storage into an independent service.

Some further design considerations are discussed in response to the prompt question (a) below.

## Resolvers

All of the design in the world doesn't yet get us to the actual usages of these patterns.
The primary goal of the design has been to de-couple the various requirements -
authZ, multi-tenant inter-connectivity, and scalability.

The proof of that pudding is in it's usage - which shows up in how we implement our
resolvers. Based on the system design prompt we are responding to, we will restrict
ourselves to solving for RBAC.

### The userId and resourceId are available within the request context.

```typescript
export async function resolver(
  parent: any,
  args: any,
  context: Context,
  info: any
) {
  const { db, resourceId, userId } = context;
  if (
    await authz.isAuthorized(userId, "resolver specific permission", resourceId)
  ) {
    // the resolver works it's business logic
    return someData;
  }
}
```

### The resourceId needs to be fetched from the DB before making a decision

Notice, that we have wrapped the call to `db.collection.get()` with a `migrate()`
This is meant to ensure that all data that is accessed is of the right-version.
The migration library is imaginary at this point, but specified at a high level
in the [zero-downtime migration](./zero-downtime-migrations.md) document.

```typescript
export async function resolver(
  parent: any,
  args: any,
  context: Context,
  info: any
) {
  const { db } = context;
  const { resourceId } = migrate.collection(db.collection.get(userId, args));
  if (
    await authz.isAuthorized(userId, "resolver specific permission", resourceId)
  ) {
    // the resolver works it's business logic
    return someData;
  }
}
```

## Responses to followup questions

### [1. Scale](./challenge.md#question-1)
> How would you update the application infrastructure to accommodate serving a user base of 1 million yearly users who generate 10 million messages per year? How would your solution scale to serving 10 million users who generate 100 million messages per year?

There are two sub-problems here -

- **a.** Managing the user-base and their workspaces/connections/channels (1 -> 10M)
- **b.** Managing messages (10 -> 100M)

The two exhibit very different read/write characteristics and should be handled independently.

#### 1.a. The user base

- write load: relatively low frequency, low cadence.
- read load: Approx once per day (really once per login) for DAU. Which is likely to be a small fraction of the full user base.
- the data has a high consistency and availability need.
- this scale of data and access be easily managed on a single node, replicated datastore.
- Since the read load is much higher than the write load, it's also possible to scale
  the system to being much larger by using an in-memory cache.

#### 1.b. Messages

- the read load is a slight multiplier on the write load, since in general a channel will have
  multiple members. Since we are making blind assumptions, we'll apply this to the SampleCompany
  use case, and assume an avg of 5 members/channel.
- the data has a temporal accessibility need. Especially given that we are applying it to a school
  setting useful life of a message might be more like 6 months or less. If durability of messages
  is a requirement, it is likely best to duplicate the messages on write - to something like S3
  AND the mongo DB instance. The mongoDB collection should have a TTL index to clean up older
  messages.
- Depending on the access patterns, once we see problems with performance of the message access,
  it might be time to consider an inline caching system like Redis.
- As a design principle, we should avoid over-engineering this too early - in architecture or
  application complexity.

### [2. DataModel](./challenge.md#question-2):
> How would you change the existing data models to accommodate multi-tenant inter-connectivity?

For the given data-model, we'd make the following additions:
- add a Connection collection and appropriately link them into channels and users. 
- define the ChannelRoles

```diff
+interface Connection {
+  // unique ID for this connection
+  id: string;
+
+  // the workspace ID that this connection is initiated from
+  fromWorkspaceId: string;
+
+  // the workspace ID that this connection is initiated to
+  toWorkspaceId: string;
+
+  // name of this connection, such as #connection-name
+  name: string;
+
+  // Date-time for when this connection was created.
+  createdAt: Date;
+}
+
+interface ConnectionRole {
+  // the workspace this role is tied to
+  workspaceId: string;
+
+  // the connection this role is tied to
+  connectionId: string;
+
+  // CONNECTION_ADMIN or CONNECTION_MEMBER of the connection
+  roleType: string;
+
+  // The creation date of this role
+  createdAt: Date;
+
+  // The most recent date this role is archived
+  archiveDate: Date;
+}
+
 interface Channel {
   // unique ID for this channel
   id: string;

-  // the workspace ID that this channel is contained in
+  // the workspace/connection ID that this channel is contained in
   workspaceId: string;
+  connectionId: string;

   // name of this channel, such as #channel-name
   name: string;

   // Date-time for when this channel was created.
   createdAt: Date;
 }

 interface User {
   // unique ID for this user
   id: string;

   // name of this user
   name: string;

   // email address of this user
   email: string;

   // the list of roles that this user holds in the workspace
   workspaceRoles: WorkspaceRole[];

   // the list of roles that this user holds in particular channels
   channelRoles: ChannelRole[];

+  // the list of roles that this user holds in particular connections
+  connectionRoles: ConnectionRole[];
+
   // Date-time for when this user was created.
   createdAt: Date;
 }
```


### [3. API](./challenge.md#question-3)

> What potential back-end API endpoints (which may have not been specifically outlined in the aforementioned challenge prompt) on the backend API server may need to be adjusted?

From the API perspective, we will assume existing authN capability, allows authZ modifications can be completely contained to being server side. We do need to extend the API to allow the user to perform these two operations from the UI.

```graphql
type Mutations {
  # Additional
  connectWorkspaces(
    fromWorkspaceId: String,
    toWorkSpaceId: String,
    peerAdminId: String
  ): Connection

  acceptInvite(
    connectionId: String,
    invitationCode: String
  )
}
```

### [4. authZ modifications on the API](./challenge.md#question-4)

> What authorization controls might you consider as adjustments to APIs that might be enabling tenant inter-connectivity, in the paradigm where members of different tenants may have the context to be authorized to use those endpoints?

As stated in the discussion to #3 above, authZ modifications should not affect the API itself. 
It's true that we need more APIs to enable different connectivity, however that is for additional capability to invite other workspaces/admins and accept invitations.
Not by itself an authZ capability.

### [5. Migration plan](./challenge.md#question-5)

> How would you structure the overall migration plan of accomplishing the introduction of such a feature, on the front-end and back-end, with a team of engineers focused on accomplishing this endeavor alongside you?

At a high level, we will spell out the tasks, to help us scope the problem
and possible team size. For the purposes of this exercise, we will assume that 
the additional work in terms of the infrastructure is to be minimized. We are
piggy-backing on existing infra and only making minimal additions.

#### Tentative Dev Plan

##### Implementation goals:

- The code should be written in a functional style to make testing easier
- Test coverage goal should be 100% for all code added/modified

The image below lays out a tentative dev-plan, demonstrating some of the parallelization that might be possible. 
A more detailed plan would require a deeper analysis & estimation of the tasks.
![Dev plan](./dev-plan.jpg) 

This is also available as a [github project view here](https://github.com/users/sramam/projects/2/views/3)

---
#### Integration & Load Testing

##### What?

- End-to-End integration tests to ensure we meet the requirements
- Load tests to ensure we meet system design goals

##### How?

- TBD


---
#### Deployment Plan

##### What?

- DB migration testing - especially if we are introducing the zero-downtime upgrades, will have to be reasonably extensive
- App migration staging
- App migration

##### How?

- DB migration: Should be part of the new code base
- App migration: Use current deployment mechanics?

---

#### Project Risk Factors

- zero-downtime migrations is a new capability at the infra layer we are building and the largest risk to the project.
- The rest of the implementation is reasonably straight-forward. A deeper dive into the existing code base and analysis of the team capabilities is required before we can articulate any risks.
- End-to-End testing. Is current capability sufficient?
- Load testing. Is current capability sufficient?
- Deployment mechanics. We are assuming existing CI/CD pipelines are sufficient.

---
---

Links:
- [Home](https://sramam.github.io/work-sample/) 
- [Challenge](https://sramam.github.io/work-sample/challenge)
- [Response](https://sramam.github.io/work-sample/solution)
- [zero-downtime migration](https://sramam.github.io/work-sample/zero-downtime-migrations#zero-downtime-migrations)

Git Repo:
- [Source Code](https://github.com/sramam/work-sample)
- [Readme](https://github.com/sramam/work-sample#readme)
- [Code Design](https://github.com/sramam/work-sample/blob/main/DESIGN.md)

---
